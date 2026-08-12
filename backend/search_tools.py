def get_search_tool():
    """Raw Tavily search client. Imported lazily for fast cold-start."""
    from langchain_tavily import TavilySearch
    return TavilySearch(max_results=3)


def make_web_search_tool():
    """Wrap the Tavily client as a LangChain tool the agent can call."""
    from langchain_core.tools import tool as lc_tool

    search_tool = get_search_tool()

    @lc_tool
    def web_search(query: str) -> str:
        """Search the web for Indian Government information."""
        return search_tool.run(query)

    return web_search
