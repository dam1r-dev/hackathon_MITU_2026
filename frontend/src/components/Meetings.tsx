import { useEffect, useState } from "react";
import type { Dict } from "../i18n";
import type { InMinutes, Meeting, Profile } from "../types";
import { Avatar, Button, Spinner } from "./ui";

const TIMES: InMinutes[] = [0, 5, 10, 15];

/** Re-renders every `ms`, so countdowns stay live. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

export const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Compact bottom sheet (centered on a projector-sized screen): where and when, then send. */
export function MeetSheet({
  t,
  target,
  locations,
  busy,
  error,
  onSend,
  onClose,
}: {
  t: Dict;
  target: Profile;
  locations: string[];
  busy: boolean;
  error: string | null;
  onSend: (location: string, inMinutes: InMinutes) => void;
  onClose: () => void;
}) {
  const [place, setPlace] = useState<string | null>(locations[0] ?? null);
  const [when, setWhen] = useState<InMinutes>(5);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={t.meetSheetTitle(target.name)} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" aria-hidden />
        <header className="sheet-head">
          <Avatar name={target.name} goal={target.goal} size={44} />
          <div className="who">
            <h2>{t.meetSheetTitle(target.name)}</h2>
            <span className="muted">{target.role}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t.meetClose}>
            ✕
          </button>
        </header>

        <div className="sheet-block">
          <div className="eyebrow">{t.meetWhere}</div>
          <div className="loc-picker">
            {locations.map((l) => (
              <button key={l} type="button" className="loc-chip" aria-pressed={place === l} onClick={() => setPlace(l)}>
                📍 {l}
              </button>
            ))}
          </div>
        </div>

        <div className="sheet-block">
          <div className="eyebrow">{t.meetWhen}</div>
          <div className="loc-picker">
            {TIMES.map((m) => (
              <button key={m} type="button" className="loc-chip" aria-pressed={when === m} onClick={() => setWhen(m)}>
                {m === 0 ? t.meetWhenNow : t.meetInMin(m)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <Button type="button" disabled={busy || !place} onClick={() => place && onSend(place, when)}>
          {busy && <Spinner />} {t.meetSend}
        </Button>
      </div>
    </div>
  );
}

function Countdown({ t, at, now }: { t: Dict; at: string; now: number }) {
  const left = Math.round((new Date(at).getTime() - now) / 1000);
  if (left <= 0) return <span className="count count-now">{t.meetHappening}</span>;
  return <span className="count mono">{t.meetStartsIn(mmss(left))}</span>;
}

/** Above the tabs: incoming invites, upcoming (accepted) meetings with a countdown, done ones collapsed. */
export function MeetingsStrip({
  t,
  meetings,
  busyId,
  onRespond,
  onDone,
}: {
  t: Dict;
  meetings: Meeting[];
  busyId: string | null;
  onRespond: (m: Meeting, accept: boolean) => void;
  onDone: (m: Meeting) => void;
}) {
  const now = useNow();
  const incoming = meetings.filter((m) => m.status === "proposed" && m.direction === "incoming");
  const waiting = meetings.filter((m) => m.status === "proposed" && m.direction === "outgoing");
  const accepted = meetings.filter((m) => m.status === "accepted").sort((a, b) => a.at.localeCompare(b.at));
  const done = meetings.filter((m) => m.status === "done");
  if (!incoming.length && !waiting.length && !accepted.length && !done.length) return null;

  const row = (m: Meeting, tail: React.ReactNode, note?: React.ReactNode) => (
    <li key={m.id} className="meeting" data-status={m.status}>
      <Avatar name={m.other.name} goal={m.other.goal} size={40} />
      <div className="who">
        <strong>{m.other.name}</strong>
        <span className="muted">{m.other.role}</span>
        <span className="meeting-where">
          📍 {m.location} · {clock(m.at)} {note}
        </span>
      </div>
      <div className="meeting-act">{tail}</div>
    </li>
  );

  return (
    <section className="card meetings" aria-live="polite">
      <h2 className="card-title">🤝 {t.meetingsTitle}</h2>
      <ul>
        {incoming.map((m) =>
          row(
            m,
            <>
              <Button type="button" size="sm" disabled={busyId === m.id} onClick={() => onRespond(m, true)}>
                {t.meetAccept}
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={busyId === m.id} onClick={() => onRespond(m, false)}>
                {t.meetDecline}
              </Button>
            </>,
            <span className="meeting-tag">{t.meetWants}</span>,
          ),
        )}
        {accepted.map((m) =>
          row(
            m,
            <>
              <Countdown t={t} at={m.at} now={now} />
              <Button type="button" size="sm" disabled={busyId === m.id} onClick={() => onDone(m)}>
                {t.meetWeMet} ✓
              </Button>
            </>,
          ),
        )}
        {waiting.map((m) => row(m, <span className="muted small">⏳ {t.meetWaitingReply}</span>))}
      </ul>
      {done.length > 0 && (
        <details className="meetings-done">
          <summary>✓ {t.meetDoneCount(done.length)}</summary>
          <ul>
            {done.map((m) => (
              <li key={m.id} className="meeting" data-status="done">
                <Avatar name={m.other.name} goal={m.other.goal} size={32} />
                <div className="who">
                  <strong>{m.other.name}</strong>
                  <span className="meeting-where">
                    📍 {m.location} · {clock(m.at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

/** Small bottom toast; clears itself. */
export function Toast({ text, onDone }: { text: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!text) return;
    const id = window.setTimeout(onDone, 5000);
    return () => window.clearTimeout(id);
  }, [text, onDone]);
  if (!text) return null;
  return (
    <div className="toast" role="status">
      {text}
    </div>
  );
}
