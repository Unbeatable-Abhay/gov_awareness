import logging

from .database import get_supabase_client

logger = logging.getLogger(__name__)


def check_rate_limit(key: str, window_seconds: int, max_requests: int) -> bool:
    """Atomic check-and-increment against the shared Supabase counter.

    This is process-safe: the actual check-and-increment happens inside a
    single Postgres transaction with row locking (see check_rate_limit RPC),
    so it stays correct even if the app is later scaled to multiple
    Gunicorn workers or multiple server instances — unlike a plain Python
    counter, which would only be correct per-process.

    Returns True if the request is allowed (and the counter was
    incremented), False if it would exceed max_requests within the
    current window_seconds.

    Fails OPEN (returns True) if Supabase is unreachable or misconfigured.
    A rate limiter being down should degrade to "no self-throttle" rather
    than take the whole app down with it — the underlying provider's own
    rate limit is still the real backstop either way.
    """
    client = get_supabase_client()
    if client is None:
        logger.warning("Rate limiter: Supabase unavailable, failing open for key %r", key)
        return True

    try:
        result = client.rpc(
            "check_rate_limit",
            {
                "p_key": key,
                "p_window_seconds": window_seconds,
                "p_max_requests": max_requests,
            },
        ).execute()
        return bool(result.data)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Rate limit check failed for key %r: %s — failing open", key, exc)
        return True