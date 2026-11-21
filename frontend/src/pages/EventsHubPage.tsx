import { AddToCalendar } from "../components/AddToCalendar";
import { useEffect, useState } from "react";
import { api } from "../api";
import { Button, Spinner } from "../components/ui";
import type { Dict } from "../i18n";
import { session } from "../session";
import { href, type Route } from "../state";
import type { OpenEvent } from "../types";

type Props = { t: Dict; go: (r: Route) => void };

/** Home: open events to join, plus the entry for the code shown on the projector. */
export function EventsHubPage({ t, go }: Props) {
  const [events, setEvents] = useState<OpenEvent[] | null>(null);
  const [error, setError] = useState(false);
  const [mine, setMine] = useState<Set<string>>(() => new Set([session.get()?.lastEvent].filter(Boolean) as string[]));

  useEffect(() => {
    let alive = true;
    api
      .openEvents()
      .then((e) => alive && setEvents(e))
      .catch(() => alive && setError(true));
    if (session.get()) {
      api
        .me()
        .then((m) => alive && setMine((prev) => new Set([...prev, ...m.events.map((e) => e.code)])))
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="page">
      <header className="hero">
        <h1>{t.hubTitle}</h1>
        <p className="sub">{t.hubSub}</p>
      </header>

      <section className="value-grid" aria-label={t.hubTitle}>
        {t.valueCards.map((c, i) => (
          <article key={i} className="card value-card">
            <span className="value-num" aria-hidden="true">
              {i + 1}
            </span>
            <h2>{c.title}</h2>
            <p className="muted">{c.text}</p>
          </article>
        ))}
      </section>

      <section className="card hub-code">
        <div className="who">
          <h2>{t.hubCodeTitle}</h2>
          <p className="muted">{t.hubCodeSub}</p>
        </div>
        <Button type="button" onClick={() => go({ name: "pin" })}>
          {t.hubCodeBtn} →
        </Button>
      </section>

      <h2 className="card-title hub-heading">{t.hubOpenTitle}</h2>
      {error && (
        <p className="alert" role="alert">
          {t.error}
        </p>
      )}
      {!events && !error && (
        <p className="state-box">
          <Spinner />
        </p>
      )}
      {events && events.length === 0 && <p className="empty">{t.hubNone}</p>}
      {events && events.length > 0 && (
        <div className="results">
          {events.map((e) => (
            <article key={e.code} className="card event-row">
              <div className="who">
                <strong>{e.title}</strong>
                <span className="muted">
                  {[e.date, e.venue].filter(Boolean).join(" · ")}
                  {[e.date, e.venue].some(Boolean) ? " · " : ""}
                  {t.attendees(e.attendee_count)}
                </span>
                {/^\d{4}-\d{2}-\d{2}$/.test(e.date ?? "") && (
                  <AddToCalendar
                    event={{
                      title: e.title,
                      start: new Date(`${e.date}T00:00:00`),
                      allDay: true,
                      location: e.venue || undefined,
                      details: `${window.location.origin}/#/join/${e.code}`,
                    }}
                  />
                )}
              </div>
              {mine.has(e.code) ? (
                <a className="btn btn-primary btn-sm" href={href({ name: "event", code: e.code })}>
                  {t.hubOpenMine}
                </a>
              ) : (
                <a className="btn btn-primary btn-sm" href={href({ name: "event-join", code: e.code })}>
                  {t.hubJoin}
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
