import logging

from .config import Config

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


def _build_gemini():
    from langchain_google_genai import ChatGoogleGenerativeAI

    if not Config.GEMINI_API_KEY:
        logger.debug("GEMINI_API_KEY not set — skipping Gemini in fallback chain.")
        return None

    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",  # was "gemini-3-flash" — never a valid model ID;
        # the real gemini-3-flash-preview is now deprecated
        google_api_key=Config.GEMINI_API_KEY,
        max_retries=0,
        max_output_tokens=5000,
        timeout=30,
    )


def get_llms(prefer: str = "scheme"):
    """Build the ordered LLM fallback chain.

    Groq is intentionally excluded: llama-3.3-70b-versatile was deprecated
    Aug 16, 2026, and its replacement (openai/gpt-oss-120b) has a confirmed
    open LangChain bug (langchain-ai/langchain#34155) making it incompatible
    with create_agent's tools + response_format combination. Re-add Groq
    here if that's ever resolved upstream.

    SambaNova was tried as a second fallback (Aug 2026) but the account had
    no funded balance and was dropped rather than left as dead weight in
    the chain. Re-add if there's a funded account and a reason to prefer
    it over relying on Gemini as the sole backup.

    Chain order is the same regardless of `prefer` for now — Mistral has
    been the most consistently reliable provider throughout this project's
    testing, so it stays first.
    """
    mistral = _build_mistral()
    gemini = _build_gemini()

    candidates = [mistral, gemini]
    return [llm for llm in candidates if llm is not None]