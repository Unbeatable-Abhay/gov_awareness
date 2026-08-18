import logging

from flask import Blueprint, g, jsonify, request

from . import limiter
from .agents import handle_request
from .auth import require_auth

logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__)


def _user_id_key():
    """Rate-limit key for gated routes: the verified user's id (set by
    require_auth before this runs), falling back to IP if somehow missing."""
    user = getattr(g, "user", None)
    if user is not None:
        return user.id
    from flask_limiter.util import get_remote_address
    return get_remote_address()


def _get_query_or_error():
    """Safely pull `query` (and optional `exclude`) out of the request body.

    Uses get_json(silent=True) instead of request.json so a missing/invalid
    Content-Type or malformed body returns a clean 400 instead of an
    unhandled 500 from Flask's JSON parser.
    """
    body = request.get_json(silent=True)

    if not isinstance(body, dict):
        return None, None, (jsonify({"error": "Request body must be JSON with a 'query' field."}), 400)

    user_query = body.get("query")

    if not isinstance(user_query, str) or not user_query.strip():
        return None, None, (jsonify({"error": "Missing or empty 'query' field."}), 400)

    exclude_names = body.get("exclude")
    if exclude_names is not None and not isinstance(exclude_names, list):
        return None, None, (jsonify({"error": "'exclude' must be a list of scheme names."}), 400)

    return user_query.strip(), exclude_names, None


@api_bp.route("/")
def home():
    return "Backend is awake!", 200


@api_bp.route("/scheme_match", methods=["POST"])
@limiter.limit("30 per hour")
def scheme_match():
    """Free, public — light list, no login required."""
    user_query, exclude_names, error_response = _get_query_or_error()
    if error_response:
        return error_response

    data, status = handle_request("list", user_query, exclude_names=exclude_names)
    return jsonify(data), status


@api_bp.route("/scheme_directory", methods=["POST"])
@limiter.limit("30 per hour")
def scheme_directory():
    """Free, public — light list, no login required."""
    user_query, exclude_names, error_response = _get_query_or_error()
    if error_response:
        return error_response

    data, status = handle_request("list", user_query, exclude_names=exclude_names)
    return jsonify(data), status


@api_bp.route("/scheme_details", methods=["POST"])
@require_auth
@limiter.limit("20 per hour", key_func=_user_id_key)
def scheme_details():
    """Gated — full scheme detail, requires login."""
    user_query, _exclude_names, error_response = _get_query_or_error()
    if error_response:
        return error_response

    data, status = handle_request("details", user_query)
    return jsonify(data), status


@api_bp.route("/legal_advisory", methods=["POST"])
@require_auth
@limiter.limit("15 per hour", key_func=_user_id_key)
def legal_advisory():
    """Gated — legal analysis, requires login."""
    user_query, _exclude_names, error_response = _get_query_or_error()
    if error_response:
        return error_response

    data, status = handle_request("legal", user_query)
    return jsonify(data), status