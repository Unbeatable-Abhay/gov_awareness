import logging

from flask import Flask
from flask_cors import CORS

from .config import Config
from .errors import register_error_handlers
from .logging_config import setup_logging
from .routes import api_bp

logger = logging.getLogger(__name__)


def create_app() -> Flask:
    setup_logging()

    app = Flask(__name__)
    app.config.from_object(Config)

    if Config.ALLOWED_ORIGINS == "*":
        logger.warning(
            "ALLOWED_ORIGINS is not set — CORS is wide open ('*'). "
            "Set ALLOWED_ORIGINS to your frontend's domain(s) before deploying to production."
        )
    CORS(app, origins=Config.ALLOWED_ORIGINS)

    app.register_blueprint(api_bp)
    register_error_handlers(app)

    if not Config.has_any_llm_key():
        logger.warning(
            "No LLM provider API key found (GROQ_API_KEY / MISTRAL_API_KEY). "
            "AI-backed routes will return 503 until at least one is configured."
        )

    return app
