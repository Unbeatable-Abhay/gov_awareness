import logging

from .config import Config
from .rate_limiter import check_rate_limit

logger = logging.getLogger(__name__)


def _build_mistral():
    from langchain_openai import ChatOpenAI

    if not Config.MISTRAL_API_KEY:
        logger.debug("MISTRAL_API_KEY not set — skipping Mistral in fallback chain.")
        return None

    return ChatOpenAI(
        model="mistral-large-latest",
        api_key=Config.MISTRAL_API_KEY,
        base_url="https://api.mistral.ai/v1",
        max_retries=0,
        max_tokens=8000,
        timeout=60,
    )


def _build_mistral_small():
    from langchain_openai import ChatOpenAI

    if not Config.MISTRAL_API_KEY:
        logger.debug("MISTRAL_API_KEY not set — skipping Mistral Small in fallback chain.")
        return None

    return ChatOpenAI(
        model="mistral-small-latest",
        api_key=Config.MISTRAL_API_KEY,
        base_url="https://api.mistral.ai/v1",
        max_retries=0,
        max_tokens=8000,
        timeout=60,
    )


def _build_gemini():
    from langchain_google_genai import ChatGoogleGenerativeAI

    if not Config.GEMINI_API_KEY:
        logger.debug("GEMINI_API_KEY not set — skipping Gemini in fallback chain.")
        return None

    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        google_api_key=Config.GEMINI_API_KEY,
        max_retries=0,
        max_output_tokens=5000,
        timeout=30,
    )


def _within_provider_limits(name: str, rpm: int, rpd: int) -> bool:
    """Checks a provider's self-imposed RPM and RPD budgets before we
    attempt to use it. An rpm/rpd of 0 means "no self-imposed limit" —
    the intended state once a provider is on a paid tier with enough
    headroom that self-throttling is no longer needed.
    """
    if rpm and not check_rate_limit(f"llm:{name}:rpm", window_seconds=60, max_requests=rpm):
        logger.info("%s at self-imposed RPM limit (%d/min) — skipping for this attempt.", name, rpm)
        return False
    if rpd and not check_rate_limit(f"llm:{name}:rpd", window_seconds=86400, max_requests=rpd):
        logger.info("%s at self-imposed RPD limit (%d/day) — skipping for this attempt.", name, rpd)
        return False
    return True


def get_llms(prefer: str = "scheme"):
    """Build the ordered LLM fallback chain, skipping any provider that's
    currently at its own self-imposed rate limit (see Config.*_RPM/_RPD).

    Chain order: Mistral Large -> Mistral Small -> Gemini 3.5 Flash.

    Mistral Small added Aug 26 as a middle tier between Large and Gemini.
    Whether it shares Mistral Large's account-level quota or has its own
    separate pool is UNCONFIRMED — Mistral's own docs contradict each
    other on this (workspace-level docs say shared; the FAQ article says
    "applied per model"). Not yet verified live. MISTRAL_SMALL_RPM/RPD
    default to 0 (unlimited) until that's actually tested — if it turns
    out to share Large's quota, self-throttling Small independently
    wouldn't help anyway; if it's separate, these knobs let us tune it
    once we know the real numbers (same pattern as the Gemini RPD fix).

    Groq is intentionally excluded: llama-3.3-70b-versatile was deprecated
    Aug 16, 2026, and its replacement (openai/gpt-oss-120b) has a confirmed
    open LangChain bug (langchain-ai/langchain#34155) making it incompatible
    with create_agent's tools + response_format combination. Re-add Groq
    here if that's ever resolved upstream.

    SambaNova was tried as a second fallback (Aug 2026) but the account had
    no funded balance and was dropped rather than left as dead weight in
    the chain. Re-add if there's a funded account.
    """
    candidates = []

    mistral = _build_mistral()
    if mistral is not None and _within_provider_limits("mistral", Config.MISTRAL_RPM, Config.MISTRAL_RPD):
        candidates.append(mistral)

    mistral_small = _build_mistral_small()
    if mistral_small is not None and _within_provider_limits(
        "mistral_small", Config.MISTRAL_SMALL_RPM, Config.MISTRAL_SMALL_RPD
    ):
        candidates.append(mistral_small)

    gemini = _build_gemini()
    if gemini is not None and _within_provider_limits("gemini", Config.GEMINI_RPM, Config.GEMINI_RPD):
        candidates.append(gemini)

    return candidates