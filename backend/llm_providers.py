import logging

from .config import Config

logger = logging.getLogger(__name__)


def _build_groq():
    from langchain_openai import ChatOpenAI

    if not Config.GROQ_API_KEY:
        logger.debug("GROQ_API_KEY not set — skipping Groq in fallback chain.")
        return None

    return ChatOpenAI(
        model="llama-3.3-70b-versatile",
        api_key=Config.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
        max_retries=0,
        max_tokens=5000,
    )


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
    )


def get_llms(prefer: str = "scheme"):
    """Build the ordered LLM fallback chain.

    The two schemas this app uses have different real-world reliability
    profiles per provider (see AGENTS.md / prompts.py for context), so the
    order is chosen per use case rather than being fixed globally:

    - prefer="scheme": Mistral first, Groq fallback. The SchemeResponse
      schema (14 fields, needs real depth) has repeatedly come back shallow
      from Groq in testing, while Mistral consistently returns full depth.
    - prefer="legal": Groq first, Mistral fallback. The simpler
      LegalResponse schema has been reliably deep and fast on Groq.
    """
    groq = _build_groq()
    mistral = _build_mistral()

    if prefer == "legal":
        candidates = [groq, mistral]
    else:
        candidates = [mistral, groq]

    return [llm for llm in candidates if llm is not None]