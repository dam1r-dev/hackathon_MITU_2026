import "./TelegramConnect.css";
import { useEffect, useState } from "react";
import { session } from "../session";
import type { Lang } from "../types";

type Link = { enabled: boolean; linked: boolean; username: string | null; url: string | null };

const TEXT: Record<Lang, { connect: string; linked: string; hint: string; off: string; noName: string }> = {
  ru: { connect: "Уведомления в Telegram", linked: "Telegram подключён", hint: "Напишем, когда интерес взаимный или вас зовут на встречу", off: "Отключить", noName: "Задайте username в настройках Telegram, чтобы контакт подтверждался" },
  kk: { connect: "Telegram хабарламалары", linked: "Telegram қосылды", hint: "Өзара қызығушылық немесе кездесуге шақыру болғанда жазамыз", off: "Ажырату", noName: "Байланыс расталуы үшін Telegram баптауында username көрсетіңіз" },
  en: { connect: "Telegram notifications", linked: "Telegram connected", hint: "We'll ping you on a mutual match or a meeting invite", off: "Disconnect", noName: "Set a username in Telegram so your contact can be confirmed" },
};

async function fetchLink(): Promise<Link | null> {
  const token = session.get()?.token;
  if (!token) return null;
  const r = await fetch("/api/tg/link", { headers: { "X-Member-Token": token } });
  return r.ok ? ((await r.json()) as Link) : null;
}

/** Shown on the event page. Hidden entirely when the bot is not configured on the server. */
export function TelegramConnect({ lang }: { lang: Lang }) {
  const [link, setLink] = useState<Link | null>(null);
  const [waiting, setWaiting] = useState(false);
  const t = TEXT[lang];

  useEffect(() => {
    fetchLink().then(setLink).catch(() => setLink(null));
  }, []);

  // After the user opened the bot, check every 3 s until the link is confirmed.
  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(async () => {
      const l = await fetchLink().catch(() => null);
      if (l?.linked) {
        setLink(l);
        setWaiting(false);
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [waiting]);

  async function disconnect() {
    const token = session.get()?.token;
    if (!token) return;
    await fetch("/api/tg/link", { method: "DELETE", headers: { "X-Member-Token": token } }).catch(() => null);
    setLink(await fetchLink().catch(() => null));
  }

  if (!link?.enabled) return null;
  if (link.linked)
    return (
      <div className="tg-connect tg-linked">
        <span>
          <span aria-hidden>✓</span> {t.linked}
          {link.username ? ` · @${link.username}` : ""}
          {!link.username && <small>{t.noName}</small>}
        </span>
        <button type="button" className="tg-off" onClick={disconnect}>
          {t.off}
        </button>
      </div>
    );
  return (
    <a className="tg-connect" href={link.url ?? "#"} target="_blank" rel="noreferrer" onClick={() => setWaiting(true)}>
      <span className="tg-icon" aria-hidden>
        ✈
      </span>
      <span>
        <strong>{t.connect}</strong>
        <small>{t.hint}</small>
      </span>
    </a>
  );
}
