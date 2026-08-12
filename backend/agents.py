import logging

from .llm_providers import get_llms
from .prompts import DIRECTORY_SYSTEM_PROMPT, LEGAL_SYSTEM_PROMPT, SCHEME_SYSTEM_PROMPT
from .schemas import LegalResponse, SchemeResponse
from .search_tools import make_web_search_tool

logger = logging.getLogger(__name__)


def make_agents(llm, tools):
    from langchain.agents import create_agent

    agent_scheme = create_agent(
        llm,
        tools=tools,
        system_prompt=SCHEME_SYSTEM_PROMPT,
        response_format=SchemeResponse,
    )

    agent_legal = create_agent(
        llm,
        tools=tools,
        system_prompt=LEGAL_SYSTEM_PROMPT,
        response_format=LegalResponse,
    )

    agent_directory = create_agent(
        llm,
        tools=tools,
        system_prompt=DIRECTORY_SYSTEM_PROMPT,
        response_format=SchemeResponse,
    )

    return agent_scheme, agent_legal, agent_directory


def extract_structured_response(response):
    """
    Pulls the validated Pydantic object LangChain builds when response_format
    is set, and converts it to a plain dict.
    Returns None if structuring didn't happen (e.g. model doesn't support it),
    so the caller can fall back to the next model.
    """
    structured = response.get("structured_response")

    if structured is None:
        return None

    if hasattr(structured, "model_dump"):
        return structured.model_dump()

    if isinstance(structured, dict):
        return structured

    return None


def _model_name(llm) -> str:
    return getattr(llm, "model_name", getattr(llm, "model", "unknown"))


def handle_request(agent_type: str, user_query: str):
    """Run the query through each configured LLM in order until one returns
    a valid structured response.

    Returns a (payload, status_code) tuple rather than a Flask response, so
    this stays framework-agnostic and unit-testable — the route layer is
    responsible for calling jsonify().
    """
    llms = get_llms()

    if not llms:
        return (
            {"error": "No AI models configured. Please set GROQ_API_KEY, GEMINI_API_KEY, or CEREBRAS_API_KEY."},
            503,
        )

    web_search = make_web_search_tool()
    tools = [web_search]

    for llm in llms:
        model_name = _model_name(llm)
        try:
            agent_scheme, agent_legal, agent_directory = make_agents(llm, tools)

            if agent_type == "scheme":
                agent = agent_scheme
            elif agent_type == "legal":
                agent = agent_legal
            else:
                agent = agent_directory

            response = agent.invoke({
                "messages": [
                    {"role": "user", "content": user_query}
                ]
            })

            logger.debug("Raw response from %s: %r", model_name, response)

            data = extract_structured_response(response)

            if data is None:
                logger.warning("No structured_response from %s, trying fallback model...", model_name)
                continue

            return data, 200

        except Exception as exc:  # noqa: BLE001 - deliberately broad: any provider failure should fall through
            logger.warning("Error using model %s: %s — trying fallback model...", model_name, exc)
            continue

    return {"error": "All AI models are currently unavailable."}, 503
