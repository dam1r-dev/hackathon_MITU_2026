"""Telegram notifications: "you have a mutual match", "X invites you to meet".

Off unless TELEGRAM_BOT_TOKEN is set. No webhook: a daemon thread long-polls getUpdates, so it
works from a laptop behind a tunnel. Linking: the member opens t.me/<bot>?start=<code>, the bot
receives "/start <code>" and stores the chat id for that member.
"""
from __future__ import annotations

import logging
import os
import secrets
import threading

import httpx
from fastapi import APIRouter, Depends

from .api_events import Auth, auth, need_member
from .ctx import ctx

log = logging.getLogger("telegram")
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
API = f"https://api.telegram.org/bot{TOKEN}"
_bot_username: str | None = None

router = APIRouter(prefix="/api/tg")

TEXT = {
    "linked": {
        "ru": "Готово! Сюда придут уведомления о взаимных знакомствах и встречах.",
        "kk": "Дайын! Өзара танысулар мен кездесулер туралы хабарламалар осында келеді.",
        "en": "Done! Mutual matches and meeting invites will arrive here.",
    },
    "unknown": {
        "ru": "Откройте бота по кнопке на сайте события.",
        "kk": "Ботты іс-шара сайтындағы батырма арқылы ашыңыз.",
        "en": "Open the bot with the button on the event page.",
    },
    "mutual": {
        "ru": "🤝 Взаимный интерес: {name} ({role}) тоже хочет познакомиться.{contact}",
        "kk": "🤝 Өзара қызығушылық: {name} ({role}) де танысқысы келеді.{contact}",
        "en": "🤝 It's mutual: {name} ({role}) wants to meet you too.{contact}",
    },
    "contact": {"ru": "\nКонтакт: {c}", "kk": "\nБайланыс: {c}", "en": "\nContact: {c}"},
    "invite": {
        "ru": "📍 {name} предлагает встретиться: {location}, {time}. Ответьте на сайте события.",
        "kk": "📍 {name} кездесуге шақырады: {location}, {time}. Іс-шара сайтында жауап беріңіз.",
        "en": "📍 {name} invites you to meet: {location}, {time}. Reply on the event page.",
    },
    "accepted": {
        "ru": "✅ {name} принял(а) встречу: {location}, {time}.",
        "kk": "✅ {name} кездесуді қабылдады: {location}, {time}.",
        "en": "✅ {name} accepted: {location}, {time}.",
    },
}


def enabled() -> bool:
    return bool(TOKEN)


def _data() -> dict:
    d = ctx.state.data
    d.setdefault("tg_links", {})  # link code -> member_id
    d.setdefault("tg_chats", {})  # member_id -> chat_id
    return d


def _lang(member_id: str) -> str:
    p = ctx.index.get(member_id)
    return p.lang if p and p.lang in ("ru", "kk", "en") else "ru"


def _send(chat_id: int, text: str) -> None:
    def run() -> None:
        try:
            httpx.post(f"{API}/sendMessage", json={"chat_id": chat_id, "text": text}, timeout=10)
        except httpx.HTTPError as e:  # a failed notification must never break the request
            log.warning("telegram send failed: %s", e)

    threading.Thread(target=run, daemon=True).start()


def notify(member_id: str, key: str, **params: str) -> None:
    """Send a localized message to a linked member. Silently does nothing when not linked."""
    if not enabled():
        return
    chat = _data()["tg_chats"].get(member_id)
    if chat is None:
        return
    lang = _lang(member_id)
    if key == "mutual":
        c = params.pop("contact", None)
        params["contact"] = TEXT["contact"][lang].format(c=c) if c else ""
    _send(chat, TEXT[key][lang].format(**params))


@router.get("/link")
def link(a: Auth = Depends(auth)) -> dict:
    """{enabled, linked, url}: url opens the bot with a one-time start code for this member."""
    member_id = need_member(a)
    if not enabled() or not _bot_username:
        return {"enabled": False, "linked": False, "url": None}
    st = ctx.state
    with st.lock:
        d = _data()
        linked = member_id in d["tg_chats"]
        code = next((c for c, m in d["tg_links"].items() if m == member_id), None)
        if not code:
            code = secrets.token_urlsafe(12)
            d["tg_links"][code] = member_id
            st.save()
    return {"enabled": True, "linked": linked, "url": f"https://t.me/{_bot_username}?start={code}"}


def _handle(update: dict) -> None:
    msg = update.get("message") or {}
    text = (msg.get("text") or "").strip()
    chat_id = (msg.get("chat") or {}).get("id")
    if chat_id is None or not text.startswith("/start"):
        return
    code = text.split(maxsplit=1)[1] if " " in text else ""
    st = ctx.state
    with st.lock:
        d = _data()
        member_id = d["tg_links"].get(code)
        if member_id:
            d["tg_chats"][member_id] = chat_id
            st.save()
    if member_id:
        _send(chat_id, TEXT["linked"][_lang(member_id)])
    else:
        _send(chat_id, TEXT["unknown"]["ru"])


def _poll() -> None:
    offset = 0
    with httpx.Client(timeout=35) as client:
        while True:
            try:
                r = client.get(f"{API}/getUpdates", params={"timeout": 25, "offset": offset})
                for u in r.json().get("result", []):
                    offset = u["update_id"] + 1
                    _handle(u)
            except Exception as e:  # keep polling through network hiccups
                log.warning("telegram poll error: %s", e)
                threading.Event().wait(3)


def start() -> None:
    """Called from the app lifespan. Learns the bot username and starts polling."""
    global _bot_username
    if not enabled():
        return
    try:
        _bot_username = httpx.get(f"{API}/getMe", timeout=10).json()["result"]["username"]
    except Exception as e:
        log.warning("telegram disabled, getMe failed: %s", e)
        return
    threading.Thread(target=_poll, daemon=True, name="telegram-poll").start()
    print(f"telegram bot @{_bot_username} polling", flush=True)


def _name_role(member_id: str) -> tuple[str, str]:
    p = ctx.index.get(member_id)
    return (p.name, p.role) if p else ("—", "")


def notify_mutual(a_id: str, b_id: str) -> None:
    """Both people get the other one's name, role and contact."""
    contacts = ctx.state.data["contacts"]
    for me, other in ((a_id, b_id), (b_id, a_id)):
        name, role = _name_role(other)
        notify(me, "mutual", name=name, role=role, contact=contacts.get(other))


def _local_time(iso: str) -> str:
    """Meeting time in Almaty (UTC+5), HH:MM."""
    from datetime import datetime, timedelta, timezone

    try:
        return datetime.fromisoformat(iso).astimezone(timezone(timedelta(hours=5))).strftime("%H:%M")
    except ValueError:
        return iso


def notify_meeting(m: dict, kind: str) -> None:
    """kind "invite" goes to the invitee, "accepted" goes back to the person who proposed."""
    sender, receiver = (m["from_id"], m["to_id"]) if kind == "invite" else (m["to_id"], m["from_id"])
    name, _ = _name_role(sender)
    notify(receiver, kind, name=name, location=m["location"], time=_local_time(m["at"]))
