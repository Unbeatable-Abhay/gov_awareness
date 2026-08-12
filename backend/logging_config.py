import logging
import sys

from .config import Config


def setup_logging() -> None:
    """Configure root logging once at app startup.

    Replaces the old print()-based debugging with real leveled logging so
    production logs aren't spammed with raw agent responses by default.
    Set LOG_LEVEL=DEBUG in the environment to see full agent traces.
    """
    root = logging.getLogger()
    if root.handlers:
        # Already configured (e.g. reloader re-import) — don't duplicate handlers.
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    )
    root.addHandler(handler)
    root.setLevel(Config.LOG_LEVEL)

    # Keep noisy third-party libraries at WARNING unless we're explicitly
    # debugging, so LOG_LEVEL=DEBUG doesn't drown in HTTP client internals.
    if Config.LOG_LEVEL != "DEBUG":
        for noisy in ("httpx", "httpcore", "urllib3"):
            logging.getLogger(noisy).setLevel(logging.WARNING)
