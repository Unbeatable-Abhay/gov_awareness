import logging

from .database import save_scheme, search_cached_schemes
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


def _build_user_message(agent_type: str, user_query: str, exclude_names: list) -> str:
    """Adds exclude context to the query sent to the agent, only when relevant."""
    if agent_type != "directory" or not exclude_names:
        return user_query

    excluded_list = ", ".join(exclude_names)
    return (
        f"{user_query}\n\n"
        f"The user has already been shown these schemes — find DIFFERENT, "
        f"additional relevant schemes, not these: {excluded_list}"
    )


def _run_live_agent(agent_type: str, user_query: str, exclude_names: list = None):
    """The original live agent+search flow — unchanged behavior, just
    extracted so handle_request can call it either directly (legal) or
    after a cache miss (scheme/directory)."""
    prefer = "legal" if agent_type == "legal" else "scheme"
    llms = get_llms(prefer=prefer)

    if not llms:
        return (
            {"error": "No AI models configured. Please set GROQ_API_KEY or MISTRAL_API_KEY."},
            503,
        )

    web_search = make_web_search_tool()
    tools = [web_search]

    message_content = _build_user_message(agent_type, user_query, exclude_names or [])

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
                    {"role": "user", "content": message_content}
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


def handle_request(agent_type: str, user_query: str, exclude_names: list = None):
    """Run the query through the DB cache first (for scheme/directory
    requests), falling back to the live agent+search chain on a cache miss
    or for legal_advisory (which is never cached — see AGENTS.md).

    exclude_names: scheme names already shown to the user, used by the
    directory endpoint's "load more" feature to avoid repeating results.

    Returns a (payload, status_code) tuple rather than a Flask response, so
    this stays framework-agnostic and unit-testable — the route layer is
    responsible for calling jsonify().
    """
    exclude_names = exclude_names or []

    if agent_type in ("scheme", "directory"):
        cached = search_cached_schemes(user_query, exclude_names=exclude_names)
        if cached:
            logger.info("Serving %d scheme(s) from cache for query: %r", len(cached), user_query)
            return {
                "schemes": cached,
                "disclaimer": "This information is for awareness purposes only. Please verify through official government portals before applying.",
            }, 200

    data, status = _run_live_agent(agent_type, user_query, exclude_names=exclude_names)

    if status == 200 and agent_type in ("scheme", "directory") and "schemes" in data:
        for scheme in data["schemes"]:
            save_scheme(scheme)

    return data, status