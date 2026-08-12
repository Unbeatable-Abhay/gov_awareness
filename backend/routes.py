import logging

from flask import Blueprint, jsonify, request

from .agents import handle_request

logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__)


def _get_query_or_error():
    """Safely pull `query` out of the request body.

    Uses get_json(silent=True) instead of request.json so a missing/invalid
    Content-Type or malformed body returns a clean 400 instead of an
    unhandled 500 from Flask's JSON parser.
    """
    body = request.get_json(silent=True)

    if not isinstance(body, dict):
        return None, (jsonify({"error": "Request body must be JSON with a 'query' field."}), 400)

    user_query = body.get("query")

    if not isinstance(user_query, str) or not user_query.strip():
        return None, (jsonify({"error": "Missing or empty 'query' field."}), 400)

    return user_query.strip(), None


@api_bp.route("/")
def home():
    return "Backend is awake!", 200


@api_bp.route("/scheme_match", methods=["POST"])
def scheme_match():
    user_query, error_response = _get_query_or_error()
    if error_response:
        return error_response

    data, status = handle_request("scheme", user_query)
    return jsonify(data), status


@api_bp.route("/legal_advisory", methods=["POST"])
def legal_advisory():
    user_query, error_response = _get_query_or_error()
    if error_response:
        return error_response

    data, status = handle_request("legal", user_query)
    return jsonify(data), status


@api_bp.route("/scheme_directory", methods=["POST"])
def scheme_directory():
    user_query, error_response = _get_query_or_error()
    if error_response:
        return error_response

    data, status = handle_request("directory", user_query)
    return jsonify(data), status
