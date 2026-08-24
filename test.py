"""
Test the new Mistral -> SambaNova -> Gemini 3 Flash fallback chain.

Run from repo root:
    python test_llm_fallback.py

Tests, in order:
  1. Each provider individually, WITH tools bound AND response_format set —
     this is the exact combination that broke Groq/Cerebras. A provider
     passing here means it actually returns a structured_response, not
     silently falling through to the next one every time.
  2. Fallback triggering — break the first provider on purpose (bad key)
     and confirm the chain still returns a valid result from the next one.
  3. Full-failure path — break ALL providers and confirm we get the
     expected (error_dict, 503) tuple, not a crash.

This calls real APIs and will cost a small number of tokens across
Mistral / SambaNova / Gemini.
"""
import sys
from dotenv import load_dotenv

load_dotenv()

from backend.config import Config
from backend.llm_providers import _build_mistral, _build_sambanova, _build_gemini
from backend.agents import make_agents, extract_structured_response
from backend.search_tools import make_web_search_tool
from backend.schemas import SchemeListResponse

TEST_QUERY = "Find one government scheme related to farmer income support in India."


def test_provider(name, llm):
    print(f"\n--- Testing {name}: tools + response_format ---")
    if llm is None:
        print(f"SKIP: {name} not configured (missing API key)")
        return None

    try:
        tools = [make_web_search_tool()]
        _, _, _, agent_scheme_list = make_agents(llm, tools)
        response = agent_scheme_list.invoke({
            "messages": [{"role": "user", "content": TEST_QUERY}]
        })
        data = extract_structured_response(response)
        if data is None:
            print(f"FAIL: {name} returned no structured_response "
                  f"(tools+response_format likely incompatible on this provider's endpoint)")
            return False
        print(f"OK: {name} returned structured data ->", str(data)[:200])
        return True
    except Exception as exc:
        print(f"FAIL: {name} raised an exception:", repr(exc))
        return False


print("=== 1. Per-provider tools + response_format test ===")
results = {}
results["Mistral"] = test_provider("Mistral", _build_mistral())
results["SambaNova"] = test_provider("SambaNova", _build_sambanova())
results["Gemini 3 Flash"] = test_provider("Gemini", _build_gemini())

print("\n=== 2. Fallback triggering (break Mistral on purpose) ===")
try:
    original_mistral_key = Config.MISTRAL_API_KEY
    Config.MISTRAL_API_KEY = "sk-deliberately-invalid-for-testing"

    from backend.agents import handle_request
    data, status = handle_request("list", "scholarship for engineering students", exclude_names=[])

    Config.MISTRAL_API_KEY = original_mistral_key  # restore immediately

    if status == 200 and "schemes" in data:
        print("OK: fallback triggered correctly, got valid data from a non-Mistral provider")
    else:
        print(f"FAIL: expected 200 + schemes, got status={status}, data={data}")
except Exception as exc:
    Config.MISTRAL_API_KEY = original_mistral_key
    print("FAIL: exception during fallback test:", repr(exc))

print("\n=== 3. Full failure path (break all providers) ===")
try:
    orig_mistral = Config.MISTRAL_API_KEY
    orig_samba = Config.SAMBANOVA_API_KEY
    orig_gemini = Config.GEMINI_API_KEY

    Config.MISTRAL_API_KEY = "invalid"
    Config.SAMBANOVA_API_KEY = "invalid"
    Config.GEMINI_API_KEY = "invalid"

    from backend.agents import handle_request
    data, status = handle_request("list", "any query", exclude_names=[])

    Config.MISTRAL_API_KEY = orig_mistral
    Config.SAMBANOVA_API_KEY = orig_samba
    Config.GEMINI_API_KEY = orig_gemini

    if status == 503 and "error" in data:
        print("OK: full-failure path returned expected 503 + error dict:", data)
    else:
        print(f"FAIL: expected (error_dict, 503), got status={status}, data={data}")
except Exception as exc:
    Config.MISTRAL_API_KEY = orig_mistral
    Config.SAMBANOVA_API_KEY = orig_samba
    Config.GEMINI_API_KEY = orig_gemini
    print("FAIL: exception during full-failure test (should have been caught internally):", repr(exc))

print("\n=== Summary ===")
for name, result in results.items():
    label = "OK" if result else ("SKIPPED" if result is None else "FAIL")
    print(f"  {name}: {label}")
print("\nIf any provider FAILs on tools+response_format, that provider is silently")
print("dead weight in the chain — it'll always fall through, same failure mode as")
print("Groq/Cerebras. Consider reordering or dropping it if so.")