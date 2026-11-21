import type { CalEvent } from "./components/AddToCalendar";

type When = { date?: string | null; start_time?: string | null; end_time?: string | null; venue?: string | null };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** "21 Nov 2026 · 08:00–18:00 · METU, Almaty" (parts that are missing are skipped). */
export function eventWhen(e: When, lang?: string, withVenue = true): string {
  const l = lang ?? (document.documentElement.lang || "ru");
  let date = e.date ?? "";
  if (ISO.test(date)) {
    try {
      date = new Date(`${date}T12:00:00`).toLocaleDateString(l, { day: "numeric", month: "short", year: "numeric" });
    } catch {
      /* keep ISO */
    }
  }
  const time = e.start_time ? (e.end_time ? `${e.start_time}–${e.end_time}` : e.start_time) : "";
  return [date, time, withVenue ? e.venue : ""].filter(Boolean).join(" · ");
}

const minutesOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Calendar entry for an event: timed (Almaty, UTC+5) when start_time is set, else all-day. Null without a valid date. */
export function eventCal(
  e: When & { title: string; code: string },
): CalEvent | null {
  if (!ISO.test(e.date ?? "")) return null;
  const base = { title: e.title, location: e.venue || undefined, details: `${window.location.origin}/#/join/${e.code}` };
  if (e.start_time) {
    const mins = e.end_time ? minutesOf(e.end_time) - minutesOf(e.start_time) : 60;
    return { ...base, start: new Date(`${e.date}T${e.start_time}:00+05:00`), minutes: mins > 0 ? mins : 60 };
  }
  return { ...base, start: new Date(`${e.date}T00:00:00`), allDay: true };
}
