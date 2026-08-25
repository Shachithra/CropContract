"""Notification service — stubbed for demo. Logs alert fan-out."""

import logging

logger = logging.getLogger(__name__)


def send_alert_notification(region: str, disease: str, message: str) -> None:
    """Stub: In production this would send Web Push / FCM notifications."""
    logger.info(f"[NOTIFICATION] Alert to region={region}: {disease} — {message}")
