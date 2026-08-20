import logging
from datetime import datetime, timedelta, timezone

from .config import Config

logger = logging.getLogger(__name__)

FRESHNESS_DAYS = 15
SIMILARITY_THRESHOLD = 0.65
MATCH_COUNT = 8  # used for list/browse searches
LIGHT_FIELDS = ("scheme_name", "category", "ministry", "financial_benefits")

_supabase_client = None
_mistral_embed_client = None


def get_supabase_client():
    """Lazily create and cache the Supabase client."""
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not (Config.SUPABASE_URL and Config.SUPABASE_SERVICE_ROLE_KEY):
        logger.debug("Supabase not configured — skipping DB cache layer.")
        return None

    from supabase import create_client

    _supabase_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client


def get_embedding(text: str):
    """Turn text into a 1024-dim vector using Mistral Embed.

    Returns None if Mistral isn't configured or the call fails, so callers
    can treat this as "cache unavailable" rather than crashing the request.
    """
    if not Config.MISTRAL_API_KEY:
        return None

    try:
        from mistralai import Mistral

        global _mistral_embed_client
        if _mistral_embed_client is None:
            _mistral_embed_client = Mistral(api_key=Config.MISTRAL_API_KEY)

        response = _mistral_embed_client.embeddings.create(
            model="mistral-embed",
            inputs=[text],
        )
        return response.data[0].embedding

    except Exception as exc:  # noqa: BLE001
        logger.warning("Embedding generation failed: %s", exc)
        return None


def _scheme_search_text(scheme: dict) -> str:
    """The text we embed for a scheme — enough to represent what it's about
    without embedding the entire deep record (keeps embedding calls cheap
    and focused on what actually matters for matching)."""
    return f"{scheme.get('scheme_name', '')}. {scheme.get('category', '')}. {scheme.get('description', '')}"


def to_light_fields(scheme: dict) -> dict:
    """Trim a full cached scheme record down to just the list-view fields."""
    return {field: scheme.get(field, "") for field in LIGHT_FIELDS}


def _fetch_cached_matches(query: str, exclude_names: list, match_count: int):
    """Shared logic: embed query, call match_schemes, filter stale/excluded.
    Returns full (untrimmed) scheme dicts. Never raises."""
    client = get_supabase_client()
    if client is None:
        return []

    query_embedding = get_embedding(query)
    if query_embedding is None:
        return []

    exclude_names = exclude_names or []

    try:
        fetch_count = match_count + len(exclude_names)
        result = client.rpc(
            "match_schemes",
            {
                "query_embedding": query_embedding,
                "match_threshold": SIMILARITY_THRESHOLD,
                "match_count": fetch_count,
            },
        ).execute()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Supabase semantic search failed: %s", exc)
        return []

    rows = result.data or []
    freshness_cutoff = datetime.now(timezone.utc) - timedelta(days=FRESHNESS_DAYS)
    exclude_set = {name.strip().lower() for name in exclude_names}

    fresh_matches = []
    for row in rows:
        if row.get("scheme_name", "").strip().lower() in exclude_set:
            continue

        updated_at = row.get("updated_at")
        if not updated_at:
            continue
        updated_dt = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
        if updated_dt >= freshness_cutoff:
            row.pop("similarity", None)
            row.pop("updated_at", None)
            row.pop("id", None)
            fresh_matches.append(row)

        if len(fresh_matches) >= match_count:
            break

    return fresh_matches


def search_cached_schemes(query: str, exclude_names: list = None):
    """Full-record cache search, used by /scheme_details (single scheme
    lookups) and anywhere the full 14-field record is actually needed."""
    return _fetch_cached_matches(query, exclude_names, match_count=1)


def search_cached_schemes_light(query: str, exclude_names: list = None):
    """List-view cache search: finds fresh full records, then trims them
    down to light fields before returning. Used by scheme_match/directory."""
    full_matches = _fetch_cached_matches(query, exclude_names, match_count=MATCH_COUNT)
    return [to_light_fields(scheme) for scheme in full_matches]


def get_cached_scheme_by_name(scheme_name: str):
    """Exact-name lookup for the detail endpoint — used after a light list
    result is tapped, so we look for the specific scheme rather than doing
    a fresh semantic search."""
    client = get_supabase_client()
    if client is None:
        return None

    try:
        result = (
            client.table("schemes")
            .select("*")
            .ilike("scheme_name", scheme_name.strip())
            .limit(1)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Supabase exact-name lookup failed: %s", exc)
        return None

    rows = result.data or []
    if not rows:
        return None

    row = rows[0]
    freshness_cutoff = datetime.now(timezone.utc) - timedelta(days=FRESHNESS_DAYS)
    updated_at = row.get("updated_at")
    if updated_at:
        updated_dt = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
        if updated_dt < freshness_cutoff:
            return None  # treat as stale — caller should re-fetch live

    row.pop("id", None)
    row.pop("embedding", None)
    row.pop("updated_at", None)
    return row


def save_scheme(scheme: dict):
    """Embed and upsert a single FULL scheme record into the cache.

    Only ever called with complete, full-detail scheme dicts — the light
    list path never calls this, since partial records shouldn't be cached
    as if they were complete."""
    client = get_supabase_client()
    if client is None:
        return

    embedding = get_embedding(_scheme_search_text(scheme))
    if embedding is None:
        return

    try:
        record = {**scheme, "embedding": embedding, "updated_at": datetime.now(timezone.utc).isoformat()}
        client.table("schemes").upsert(record, on_conflict="scheme_name").execute()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to save scheme '%s' to cache: %s", scheme.get("scheme_name"), exc)


def has_user_consent(user_id: str) -> bool:
    """Checks whether a user has a recorded consent row (T&C + analytics,
    both mandatory, written together at signup). Used to gate access to
    scheme_details/legal_advisory beyond just being logged in — a user
    must have actually accepted terms, not just have a valid session."""
    client = get_supabase_client()
    if client is None:
        # Fail closed: if we can't check, don't assume consent exists.
        return False

    try:
        result = (
            client.table("user_consents")
            .select("user_id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Consent check failed for user %s: %s", user_id, exc)
        return False

    return bool(result.data)

def get_random_schemes(limit: int = 10):
    """Fetches a random sample of cached schemes, light fields only.

    Used by the free, ungated Home screen — pure DB read, no embeddings,
    no LLM call, no auth. Only returns schemes within the freshness
    window, same as everywhere else."""
    client = get_supabase_client()
    if client is None:
        return []

    try:
        result = client.rpc("random_schemes", {"result_limit": limit}).execute()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Random schemes fetch failed: %s", exc)
        return []

    rows = result.data or []
    freshness_cutoff = datetime.now(timezone.utc) - timedelta(days=FRESHNESS_DAYS)

    fresh = []
    for row in rows:
        updated_at = row.get("updated_at")
        if not updated_at:
            continue
        updated_dt = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
        if updated_dt >= freshness_cutoff:
            fresh.append(to_light_fields(row))

    return fresh