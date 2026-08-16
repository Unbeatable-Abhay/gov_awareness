import logging
from datetime import datetime, timedelta, timezone

from .config import Config

logger = logging.getLogger(__name__)

FRESHNESS_DAYS = 15
SIMILARITY_THRESHOLD = 0.65
MATCH_COUNT = 4

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


def search_cached_schemes(query: str, exclude_names: list = None):
    """Embed the query and search the schemes table for fresh, relevant matches.

    exclude_names: scheme names already shown to the user (e.g. from a
    "load more" request) — these are filtered out of the results so the
    same scheme isn't served twice.

    Returns a list of scheme dicts (fresh matches only, stale ones and
    excluded names removed) or an empty list if nothing usable is found —
    never raises, so the caller can always safely fall back to the live agent.
    """
    client = get_supabase_client()
    if client is None:
        return []

    query_embedding = get_embedding(query)
    if query_embedding is None:
        return []

    exclude_names = exclude_names or []

    try:
        # Fetch extra results so that after filtering out excluded names,
        # we still have a good chance of hitting the real match_count.
        fetch_count = MATCH_COUNT + len(exclude_names)
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

        if len(fresh_matches) >= MATCH_COUNT:
            break

    return fresh_matches


def save_scheme(scheme: dict):
    """Embed and upsert a single scheme into the cache.

    Best-effort: failures are logged but never raised, since this runs
    after we've already successfully returned a response to the user —
    a cache-write failure shouldn't affect what they see.
    """
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