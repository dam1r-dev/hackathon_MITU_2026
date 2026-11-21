import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api";
import { MatchCard } from "../components/MatchCard";
import { MeetingsStrip, MeetSheet, Toast } from "../components/Meetings";
import { TelegramConnect } from "../components/TelegramConnect";
import { GoalBars, RoomMap } from "../components/RoomMap";
import { Avatar, Button, Segmented, Spinner } from "../components/ui";
import type { Dict } from "../i18n";
import { sentMeets, session } from "../session";
import type { Route } from "../state";
import { GOALS, type EventInfo, type GraphNode, type InMinutes, type Lang, type LocationCount, type Match, type Meeting, type MutualOut, type Profile, type PublicStats } from "../types";

const POLL_MS = 8000;
const VENUE_MS = 20000;
const MEET_MS = 10000;

type Tab = "people" | "venue" | "room";

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
  const [tab, setTab] = useState<Tab>("people");
  const [counts, setCounts] = useState<LocationCount[]>([]);
  const [myLoc, setMyLoc] = useState<string | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[] | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const known = useRef<Set<string> | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sheet, setSheet] = useState<Profile | null>(null);
  const [sheetBusy, setSheetBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [meetBusy, setMeetBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const seenIncoming = useRef<Set<string> | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const loadMeetings = useCallback(async () => {
    try {
      const list = await api.meetings(code);
      const incoming = list.filter((m) => m.status === "proposed" && m.direction === "incoming");
      if (seenIncoming.current) {
        const fresh = incoming.find((m) => !seenIncoming.current!.has(m.id));
        if (fresh) {
          setToast(t.meetIncomingToast(fresh.other.name));
          navigator.vibrate?.(100);
        }
      }
      seenIncoming.current = new Set(incoming.map((m) => m.id));
      setMeetings(list);
    } catch {
      /* keep the last list; the next poll retries */
    }
  }, [code, t]);

  // Meetings: invites and the countdown, every 10 s.
  useEffect(() => {
    if (!me) return;
    seenIncoming.current = null;
    loadMeetings();
    const id = window.setInterval(loadMeetings, MEET_MS);
    return () => window.clearInterval(id);
  }, [code, lang]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Venue: live counts and my own location, every 20 s.
  useEffect(() => {
    if (!me) return;
    let alive = true;
    const loadCounts = () =>
      api
        .eventLocations(code)
        .then((c) => alive && setCounts(c))
        .catch(() => {});
    api
      .me()
      .then((m) => {
        const ev = m.events.find((e) => e.code === code);
        if (alive && ev) setMyLoc(m.locations[ev.id]?.location ?? null);
      })
      .catch(() => {});
    loadCounts();
    const id = window.setInterval(loadCounts, VENUE_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Room: map and goal statistics, loaded when the tab is open and refreshed every 20 s.
  useEffect(() => {
    if (!me || tab !== "room") return;
    let alive = true;
    const load = () => {
      api.eventGraph(code).then((g) => alive && setNodes(g.nodes)).catch(() => {});
      api.eventStats(code).then((s) => alive && setStats(s)).catch(() => {});
    };
    load();
    const id = window.setInterval(load, VENUE_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [code, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function pickLocation(name: string | null) {
    setLocBusy(true);
    try {
      const res = await api.setLocation(code, name);
      setMyLoc(res.location);
      setCounts(await api.eventLocations(code));
    } catch {
      setState("error");
    } finally {
      setLocBusy(false);
    }
  }

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

  async function sendInvite(location: string, inMinutes: InMinutes) {
    if (!sheet) return;
    setSheetBusy(true);
    setSheetError(null);
    try {
      await api.proposeMeeting(code, { target_id: sheet.id, location, in_minutes: inMinutes });
      setToast(t.meetSentToast(sheet.name));
      setSheet(null);
      await loadMeetings();
    } catch (e) {
      setSheetError(e instanceof ApiError && e.status === 409 ? t.meetErrOpen : t.error);
    } finally {
      setSheetBusy(false);
    }
  }

  async function respond(m: Meeting, accept: boolean) {
    setMeetBusy(m.id);
    try {
      await api.respondMeeting(code, m.id, accept);
      await loadMeetings();
    } catch {
      setState("error");
    } finally {
      setMeetBusy(null);
    }
  }

  async function markDone(m: Meeting) {
    setMeetBusy(m.id);
    try {
      await api.meetingDone(code, m.id);
      await loadMeetings();
    } catch {
      setState("error");
    } finally {
      setMeetBusy(null);
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

      <TelegramConnect lang={lang} />

      <MeetingsStrip t={t} meetings={meetings} busyId={meetBusy} onRespond={respond} onDone={markDone} />

      <div className="event-tabs">
        <Segmented
          label={t.eventResults}
          value={tab}
          onChange={setTab}
          options={[
            { value: "people", label: t.tabPeople },
            { value: "venue", label: t.tabVenue },
            { value: "room", label: t.tabRoom },
          ]}
        />
      </div>

      {tab === "venue" && (
        <section className="venue" aria-live="polite">
          <div className="card">
            <h2 className="card-title">{t.whereNow}</h2>
            <div className="loc-picker">
              {counts.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className="loc-chip"
                  aria-pressed={myLoc === c.name}
                  disabled={locBusy}
                  onClick={() => pickLocation(c.name)}
                >
                  📍 {c.name}
                </button>
              ))}
              <button type="button" className="loc-chip loc-hide" disabled={locBusy || !myLoc} onClick={() => pickLocation(null)}>
                {t.hideMe}
              </button>
            </div>
          </div>
          <div className="venue-grid">
            {counts.map((c) => {
              const here = (matches ?? []).filter((m) => m.location === c.name);
              const mine = myLoc === c.name;
              return (
                <div key={c.name} className="venue-tile" data-mine={mine || undefined}>
                  <div className="venue-name">{c.name}</div>
                  <div className="venue-count">
                    <strong className="mono">{c.count}</strong> <span className="muted">{t.hereNow}</span>
                  </div>
                  <div className="venue-people">
                    {here.map((m) => (
                      <span key={m.profile.id} title={m.profile.name}>
                        <Avatar name={m.profile.name} goal={m.profile.goal} size={30} />
                      </span>
                    ))}
                    {mine && <span className="tag venue-me">{t.youAreHere}</span>}
                    {!mine && here.length === 0 && c.count === 0 && <span className="muted small">{t.nobodyHere}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "room" && (
        <section className="room">
          {nodes === null ? (
            <div className="map skeleton" />
          ) : (
            <RoomMap
              nodes={nodes}
              meId={me?.memberId}
              highlights={(matches ?? []).map((m) => ({ id: m.profile.id, score: m.score }))}
              meLabel={t.you}
              label={t.mapTitle}
            />
          )}
          <div className="card">
            <h2 className="card-title">{t.roomWho}</h2>
            <GoalBars
              label={t.byGoal}
              counts={GOALS.map((g) => ({ goal: g, label: t.goals[g], n: stats?.by_goal.find((x) => x.goal === g)?.count ?? 0 }))}
            />
          </div>
        </section>
      )}

      {tab === "people" && mutual.length > 0 && (
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

      {tab === "people" && !matches && state === "ok" && (
        <div className="results">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card skeleton-card" />
          ))}
          <span className="sr-only">
            <Spinner />
          </span>
        </div>
      )}

      {tab === "people" && matches && (
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
                meetNow={{
                  open: meetings.some((x) => (x.status === "proposed" || x.status === "accepted") && x.other.id === m.profile.id),
                  onClick: () => {
                    setSheetError(null);
                    setSheet(m.profile);
                  },
                }}
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

      {sheet && (
        <MeetSheet
          t={t}
          target={sheet}
          locations={event?.locations.length ? event.locations : [event?.venue || "—"]}
          busy={sheetBusy}
          error={sheetError}
          onSend={sendInvite}
          onClose={() => setSheet(null)}
        />
      )}
      <Toast text={toast} onDone={clearToast} />
    </div>
  );
}
