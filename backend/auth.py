import logging
from functools import wraps

from flask import g, jsonify, request
from gotrue.errors import AuthApiError, AuthRetryableError

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
        except AuthApiError as exc:
            # A genuine response FROM Supabase's Auth API saying the token
            # itself is invalid, expired, or revoked. The user really does
            # need to log in again here.
            logger.info(
                "Auth token rejected by Supabase (status=%s): %s",
                getattr(exc, "status", "?"), exc,
            )
            return jsonify({"error": "Your session has expired. Please log in again."}), 401
        except AuthRetryableError as exc:
            # A network/connection-level failure talking TO Supabase's Auth
            # API — this says nothing about whether the token is actually
            # valid. Telling the user to log in again here would be
            # actively misleading; it's a transient failure, not a rejection.
            logger.warning("Transient error verifying auth token: %s", exc)
            return jsonify({"error": "Couldn't verify your session right now. Please try again."}), 503
        except Exception as exc:  # noqa: BLE001
            # Anything else unexpected — e.g. a raw OS-level socket error
            # (observed locally as WinError 10035) that isn't wrapped into
            # one of gotrue's own exception types. Same reasoning as
            # AuthRetryableError: we don't actually know the token was
            # invalid, only that verifying it failed. Fail toward
            # "try again," not toward "log in again."
            logger.warning("Unexpected error verifying auth token: %s", exc)
            return jsonify({"error": "Couldn't verify your session right now. Please try again."}), 503

        if result is None or result.user is None:
            return jsonify({"error": "Login required for this feature."}), 401

        if not has_user_consent(result.user.id):
            return jsonify({"error": "Please accept our Terms and Analytics consent to continue."}), 403

        g.user = result.user
        return view_func(*args, **kwargs)

    return wrapper