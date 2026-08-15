import logging

from .config import Config

logger = logging.getLogger(__name__)


def get_llms():
    """Build the ordered LLM fallback chain: Groq -> Mistral.

    Imports are kept local so the app can start (and e.g. serve `/`) even if
    these optional heavyweight packages have import-time issues, and so
    cold-start stays fast when a request doesn't need them.
    """
    from langchain_openai import ChatOpenAI

    llms = []

    if Config.GROQ_API_KEY:
        llms.append(ChatOpenAI(
            model="llama-3.3-70b-versatile",
            api_key=Config.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            max_retries=0,
            max_tokens=5000,
        ))
    else:
        logger.debug("GROQ_API_KEY not set — skipping Groq in fallback chain.")

    if Config.MISTRAL_API_KEY:
        llms.append(ChatOpenAI(
            model="mistral-large-latest",
            api_key=Config.MISTRAL_API_KEY,
            base_url="https://api.mistral.ai/v1",
            max_retries=0,
            max_tokens=8000,
        ))
    else:
        logger.debug("MISTRAL_API_KEY not set — skipping Mistral in fallback chain.")

    return llms