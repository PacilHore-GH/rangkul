"""Deprecated compatibility exports.

New code must import the owning feature service, e.g.
``app.modules.identity.service``.
"""

from app.modules.identity.service import (  # noqa: F401
    consume_reset_token,
    create_reset_token,
    create_session,
    get_current_user,
    hash_password,
    normalize_email,
    revoke_session,
    verify_password,
)
