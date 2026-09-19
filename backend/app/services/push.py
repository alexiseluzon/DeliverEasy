import logging

import httpx

logger = logging.getLogger(__name__)

_EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push_notification(
    token: str | None, title: str, body: str, data: dict | None = None
) -> None:
    """Best-effort push send. Never raises — a failed notification should
    never break the order-status update that triggered it."""
    if not token:
        return

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            payload = {"to": token, "title": title, "body": body, "sound": "default"}
            if data:
                payload["data"] = data
            res = await client.post(_EXPO_PUSH_URL, json=payload, headers={"Content-Type": "application/json"})
            if res.status_code != 200:
                logger.warning("Push notification failed (%s): %s", res.status_code, res.text)
    except httpx.HTTPError as exc:
        logger.warning("Push notification request failed: %s", exc)