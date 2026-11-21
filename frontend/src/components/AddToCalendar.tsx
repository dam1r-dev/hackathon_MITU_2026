import "./AddToCalendar.css";

/**
 * "Add to calendar" without OAuth: a prefilled Google Calendar link plus an .ics file
 * (Apple Calendar, Outlook). Nothing is sent to Google until the person presses Save there.
 */
export type CalEvent = {
  title: string;
  start: Date;
  /** Minutes; ignored for all-day events. */
  minutes?: number;
  allDay?: boolean;
  location?: string;
  details?: string;
};

type Lang = "ru" | "kk" | "en";
const TEXT: Record<Lang, { google: string; ics: string; title: string }> = {
  ru: { google: "Google Календарь", ics: ".ics", title: "Добавить в календарь" },
  kk: { google: "Google Күнтізбе", ics: ".ics", title: "Күнтізбеге қосу" },
  en: { google: "Google Calendar", ics: ".ics", title: "Add to calendar" },
};

const pad = (n: number) => String(n).padStart(2, "0");
const utc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const day = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

function range(e: CalEvent): [string, string] {
  if (e.allDay) {
    const next = new Date(e.start);
    next.setDate(next.getDate() + 1);
    return [day(e.start), day(next)];
  }
  return [utc(e.start), utc(new Date(e.start.getTime() + (e.minutes ?? 15) * 60_000))];
}

export function googleCalendarUrl(e: CalEvent): string {
  const [a, b] = range(e);
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${a}/${b}` });
  if (e.location) q.set("location", e.location);
  if (e.details) q.set("details", e.details);
  return `https://calendar.google.com/calendar/render?${q}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function icsText(e: CalEvent): string {
  const [a, b] = range(e);
  const dt = e.allDay ? ["DTSTART;VALUE=DATE:" + a, "DTEND;VALUE=DATE:" + b] : ["DTSTART:" + a, "DTEND:" + b];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Qazaq IT Networking//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@qazaq-it-networking`,
    "DTSTAMP:" + utc(new Date()),
    ...dt,
    "SUMMARY:" + esc(e.title),
    ...(e.location ? ["LOCATION:" + esc(e.location)] : []),
    ...(e.details ? ["DESCRIPTION:" + esc(e.details)] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadIcs(e: CalEvent) {
  const url = URL.createObjectURL(new Blob([icsText(e)], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.title.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40) || "event"}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AddToCalendar({ event }: { event: CalEvent }) {
  const lang = (["ru", "kk", "en"].includes(document.documentElement.lang) ? document.documentElement.lang : "ru") as Lang;
  const t = TEXT[lang];
  return (
    <span className="cal" role="group" aria-label={t.title}>
      <a className="cal-btn" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" title={t.title}>
        📅 {t.google}
      </a>
      <button type="button" className="cal-btn cal-ics" onClick={() => downloadIcs(event)} title={t.title}>
        {t.ics}
      </button>
    </span>
  );
}
