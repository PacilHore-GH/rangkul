"""Provider-independent password-reset mailer port and MVP adapters."""

import logging
from dataclasses import dataclass
from typing import Protocol

logger = logging.getLogger(__name__)


class Mailer(Protocol):
    def send_password_reset(self, *, recipient: str, reset_url: str, expires_minutes: int) -> None: ...


class ConsoleMailer:
    def send_password_reset(self, *, recipient: str, reset_url: str, expires_minutes: int) -> None:
        logger.info(
            "Development password reset recipient=%s expires_minutes=%s url=%s",
            recipient,
            expires_minutes,
            reset_url,
        )


@dataclass
class SentPasswordReset:
    recipient: str
    reset_url: str
    expires_minutes: int


class FakeMailer:
    def __init__(self) -> None:
        self.sent: list[SentPasswordReset] = []

    def send_password_reset(self, *, recipient: str, reset_url: str, expires_minutes: int) -> None:
        self.sent.append(SentPasswordReset(recipient, reset_url, expires_minutes))


_console_mailer = ConsoleMailer()
_fake_mailer = FakeMailer()


def get_mailer() -> Mailer:
    from app.core.config import settings

    return _fake_mailer if settings.MAILER_BACKEND == "fake" else _console_mailer
