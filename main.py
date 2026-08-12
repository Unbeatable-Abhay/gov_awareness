"""
Entry point for both local development and production (gunicorn).

- Local dev:   python main.py
- Production:  gunicorn main:app   (see Procfile)
"""
from dotenv import load_dotenv

load_dotenv()

from backend import create_app  # noqa: E402 - must run after load_dotenv()
from backend.config import Config  # noqa: E402

app = create_app()

if __name__ == "__main__":
    # host='0.0.0.0' is required for this to be reachable on Render/other
    # PaaS hosts — 'localhost' (the old default) only accepts connections
    # from inside the container itself.
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
