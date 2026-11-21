import "./TelegramConnect.css";
import { useEffect, useState } from "react";
import { session } from "../session";
import type { Lang } from "../types";

type Link = { enabled: boolean; linked: boolean; url: string | null };

const TEXT: Record<Lang, { connect: string; linked: string; hint: string }> = {
  ru: { connect: "Уведомления в Telegram", linked: "Telegram подключён", hint: "Напишем, когда интерес взаимный или вас зовут на встречу" },
  kk: { connect: "Telegram хабарламалары", linked: "Telegram қосылды", hint: "Өзара қызығушылық немесе кездесуге шақыру болғанда жазамыз" },
  en: { connect: "Telegram notifications", linked: "Telegram connected", hint: "We'll ping you on a mutual match or a meeting invite" },
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

  if (!link?.enabled) return null;
  if (link.linked)
    return (
      <div className="tg-connect tg-linked">
        <span aria-hidden>✓</span> {t.linked}
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
