import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api";
import { MatchCard } from "../components/MatchCard";
import { Avatar, Button, Spinner } from "../components/ui";
import type { Dict } from "../i18n";
import { sentMeets, session } from "../session";
import type { Route } from "../state";
import type { EventInfo, Lang, Match, MutualOut } from "../types";

const POLL_MS = 8000;

type Props = { t: Dict; lang: Lang; code: string; go: (r: Route) => void };

/** My top 5 inside one event. Refreshes as people arrive; "want to meet" reveals contacts when mutual. */
export function EventPage({ t, lang, code, go }: Props) {
  const me = session.get();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [tookMs, setTookMs] = useState(0);
  const [mutual, setMutual] = useState<MutualOut[]>([]);
  const [sent, setSent] = useState<string[]>(() => sentMeets.get(code));
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [state, setState] = useState<"ok" | "error" | "outside">(me ? "ok" : "outside");
  const known = useRef<Set<string> | null>(null);

  const apply = (ms: Match[], took: number) => {
    // Mark people who were not in the list before (not on the first load).
    if (known.current) {
      const added = ms.filter((m) => !known.current!.has(m.profile.id)).map((m) => m.profile.id);
      if (added.length) setFresh(new Set(added));
    }
    known.current = new Set(ms.map((m) => m.profile.id));
    setMatches(ms);
    setTookMs(took);
  };

  useEffect(() => {
    if (!me) return;
    let alive = true;
    let timer: number | undefined;
    api.event(code).then((e) => alive && setEvent(e)).catch(() => {});
    const load = async () => {
      try {
        const [res, mu] = await Promise.all([api.eventMatches(code, lang), api.mutual(code)]);
        if (!alive) return;
        apply(res.matches, res.took_ms);
        setMutual(mu);
        setState("ok");
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          if (e.status === 401) session.clear();
          setState("outside");
          return; // stop polling
        }
        setState("error");
      }
      if (alive) timer = window.setTimeout(load, POLL_MS);
    };
    load();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [code, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  async function wantMeet(targetId: string) {
    setBusyId(targetId);
    try {
      const res = await api.meet(code, targetId);
      setSent(sentMeets.add(code, targetId));
      if (res.mutual) setMutual(await api.mutual(code));
    } catch {
      setState("error");
    } finally {
      setBusyId(null);
    }
  }

  async function feedback(targetId: string, verdict: "met" | "not_fit") {
    if (!me) return;
    setBusyId(targetId);
    try {
      const res = await api.feedback(me.memberId, targetId, verdict, code);
      apply(res.matches, res.took_ms);
    } catch {
      setState("error");
    } finally {
      setBusyId(null);
    }
  }

  if (state === "outside")
    return (
      <div className="page">
        <div className="state-box">
          <p>{t.notInEvent}</p>
          <Button type="button" onClick={() => go({ name: "event-join", code })}>
            {t.joinCta}
          </Button>
        </div>
      </div>
    );

  const mutualById = new Map(mutual.map((m) => [m.profile.id, m]));

  return (
    <div className="page">
      <header className="hero">
        {event && (
          <div className="event-meta">
            <span className="badge-code mono">{event.code}</span>
            {event.title}
          </div>
        )}
        <h1>{t.eventResults}</h1>
        <p className="live">
          <span className="live-dot" /> {t.liveUpdates}
          {matches && <span className="mono"> · {t.tookMs(tookMs)}</span>}
        </p>
      </header>

      {state === "error" && (
        <p className="alert" role="alert">
          {t.error}
        </p>
      )}

      {mutual.length > 0 && (
        <section className="card mutual" aria-live="polite">
          <h2 className="card-title">🎉 {t.mutualTitle}</h2>
          <ul>
            {mutual.map((m) => (
              <li key={m.profile.id}>
                <Avatar name={m.profile.name} goal={m.profile.goal} size={36} />
                <div className="who">
                  <strong>{m.profile.name}</strong>
                  <span className="muted">{m.profile.role}</span>
                </div>
                {m.contact ? <span className="mono contact">{m.contact}</span> : <span className="muted small">{t.noContact}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!matches && state === "ok" && (
        <div className="results">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card skeleton-card" />
          ))}
          <span className="sr-only">
            <Spinner />
          </span>
        </div>
      )}

      {matches && (
        <section className="results" aria-live="polite">
          {matches.length < 5 && <p className="empty">{t.fewYet}</p>}
          {matches.map((m, i) => {
            const mu = mutualById.get(m.profile.id);
            return (
              <MatchCard
                key={m.profile.id}
                t={t}
                m={m}
                rank={i}
                isNew={fresh.has(m.profile.id)}
                busy={busyId !== null}
                onFeedback={(v) => feedback(m.profile.id, v)}
                meet={{
                  state: mu ? "mutual" : sent.includes(m.profile.id) ? "waiting" : "idle",
                  contact: mu?.contact,
                  onClick: () => wantMeet(m.profile.id),
                }}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}
