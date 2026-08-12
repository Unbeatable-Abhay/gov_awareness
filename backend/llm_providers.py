import logging

from .config import Config

logger = logging.getLogger(__name__)


def get_llms():
    """Build the ordered LLM fallback chain: Groq -> Gemini -> Cerebras.

    Imports are kept local so the app can start (and e.g. serve `/`) even if
    these optional heavyweight packages have import-time issues, and so
    cold-start stays fast when a request doesn't need them.
    """
    from langchain_openai import ChatOpenAI
    from langchain_google_genai import ChatGoogleGenerativeAI

    llms = []

    if Config.GROQ_API_KEY:
        llms.append(ChatOpenAI(
            model="llama-3.3-70b-versatile",
            api_key=Config.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            max_retries=0,
        ))
        llms.append(ChatOpenAI(
            model="llama-3.1-8b-instant",
            api_key=Config.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            max_retries=0,
        ))
    else:
        logger.debug("GROQ_API_KEY not set — skipping Groq models in fallback chain.")

    if Config.GEMINI_API_KEY:
        llms.append(ChatGoogleGenerativeAI(
            model=Config.GEMINI_MODEL,
            google_api_key=Config.GEMINI_API_KEY,
            max_retries=0,
        ))
    else:
        logger.debug("GEMINI_API_KEY not set — skipping Gemini in fallback chain.")

    if Config.CEREBRAS_API_KEY:
        llms.append(ChatOpenAI(
            model="gpt-oss-120b",
            api_key=Config.CEREBRAS_API_KEY,
            base_url="https://api.cerebras.ai/v1",
            max_retries=0,
        ))
    else:
        logger.debug("CEREBRAS_API_KEY not set — skipping Cerebras in fallback chain.")

    return llms
