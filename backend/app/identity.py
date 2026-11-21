"""Who a member really is: Telegram-verified contact and GitHub-verified login."""
from __future__ import annotations

from .ctx import ctx
from .models import Profile


def verified_username(member_id: str) -> str | None:
    """Telegram @username of a member whose chat is linked, else None."""
    d = ctx.state.data
    if member_id not in d["tg_chats"]:
        return None
    return (d["tg_users"].get(member_id) or {}).get("username") or None


def contact_of(member_id: str) -> tuple[str | None, bool]:
    """(contact to show to a mutual match, verified). Linked Telegram username beats the typed text."""
    u = verified_username(member_id)
    if u:
        return f"@{u}", True
    return ctx.state.data["contacts"].get(member_id), False


def with_github(p: Profile) -> Profile:
    login = ctx.state.data["github"].get(p.id)
    return p.model_copy(update={"github": login}) if login else p
