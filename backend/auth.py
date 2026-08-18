import logging
from functools import wraps

from flask import g, jsonify, request

from .database import get_supabase_client, has_user_consent

logger = logging.getLogger(__name__)


def require_auth(view_func):
    """Protects a route so it only runs for a logged-in user who has also
    accepted the mandatory Terms & Conditions / Analytics consent.

    Expects an `Authorization: Bearer <supabase_access_token>` header.
    Verifies the token against Supabase Auth, then checks for a
    user_consents row. On success, the verified user is available as
    `g.user` inside the view.
    """

    @wraps(view_func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Login required for this feature."}), 401

        token = auth_header.removeprefix("Bearer ").strip()

        client = get_supabase_client()
        if client is None:
            logger.warning("Supabase not configured — cannot verify auth token.")
            return jsonify({"error": "Login is temporarily unavailable."}), 503

        try:
            result = client.auth.get_user(token)
        except Exception as exc:  # noqa: BLE001
            logger.info("Auth token verification failed: %s", exc)
            return jsonify({"error": "Your session has expired. Please log in again."}), 401

        if result is None or result.user is None:
            return jsonify({"error": "Login required for this feature."}), 401

        if not has_user_consent(result.user.id):
            return jsonify({"error": "Please accept our Terms and Analytics consent to continue."}), 403

        g.user = result.user
        return view_func(*args, **kwargs)

    return wrapper