import logging

from flask import jsonify

logger = logging.getLogger(__name__)


def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(_error):
        return jsonify({"error": "Method not allowed."}), 405

    @app.errorhandler(500)
    def internal_error(error):
        logger.exception("Unhandled server error: %s", error)
        return jsonify({"error": "Internal server error."}), 500
