import os


def _split_csv(value: str):
    return [v.strip() for v in value.split(",") if v.strip()]


class Config:
    """Central place for all environment-driven configuration.

    Nothing here should read env vars directly anywhere else in the app —
    add new settings here so there's one place to check what's configurable.
    """

    # --- Server ---
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # --- CORS ---
    # Comma-separated list of allowed origins, e.g.
    # "https://sarkarly.vercel.app,http://localhost:3000"
    # Defaults to "*" for local development convenience, but this should
    # ALWAYS be set explicitly in production.
    _raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
    ALLOWED_ORIGINS = "*" if _raw_origins == "*" else _split_csv(_raw_origins)

    # --- Logging ---
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

    # --- API keys (existence is checked, values are read lazily where used) ---
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
    TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    @classmethod
    def has_any_llm_key(cls) -> bool:
        return bool(cls.GROQ_API_KEY or cls.MISTRAL_API_KEY)