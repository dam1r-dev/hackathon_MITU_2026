import { eventWhen } from "../eventTime";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api";
import { LiveCounter } from "../components/LiveCounter";
import { edgeKey, GoalBars, RoomMap } from "../components/RoomMap";
import { Button } from "../components/ui";
import type { Dict } from "../i18n";
import { storageSet, type Route } from "../state";
import { GOALS, type EventInfo, type GraphNode, type LiveFeed, type LocationCount } from "../types";

const POLL_MS = 4000;

type Props = { t: Dict; code: string; go: (r: Route) => void };

/** Projector: big QR, live counter, room map of this event (names are initials, the route is public). */
export function ScreenPage({ t, code, go }: Props) {
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [nodes, setNodes] = useState<GraphNode[] | null>(null);
  const [state, setState] = useState<"ok" | "notfound" | "error">("ok");
  const [places, setPlaces] = useState<LocationCount[]>([]);
  const [codeInput, setCodeInput] = useState(code);
  const [pin, setPin] = useState<{ pin: string; left: number } | null>(null);
  const [live, setLive] = useState<LiveFeed | null>(null);
  const [freshEdges, setFreshEdges] = useState<Set<string>>(new Set());
  const [pulseIds, setPulseIds] = useState<Set<string>>(new Set());
  const seenEdges = useRef<Set<string> | null>(null);

  // Live feed: links between people (mutual interest, meetings) and counters, every 4 s.
  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    let clear: number | undefined;
    seenEdges.current = null;
    setLive(null);
    setFreshEdges(new Set());
    setPulseIds(new Set());
    const load = async () => {
      try {
        const feed = await api.eventLive(code);
        if (!alive) return;
        const keys = feed.edges.map(edgeKey);
        if (seenEdges.current) {
          const added = feed.edges.filter((e) => !seenEdges.current!.has(edgeKey(e)));
          if (added.length) {
            setFreshEdges(new Set(added.map(edgeKey)));
            setPulseIds(new Set(added.flatMap((e) => [e.from, e.to])));
            window.clearTimeout(clear);
            clear = window.setTimeout(() => {
              setFreshEdges(new Set());
              setPulseIds(new Set());
            }, 3600);
          }
        }
        seenEdges.current = new Set(keys);
        setLive(feed);
      } catch {
        /* keep what is on screen; the next poll retries */
      }
      if (alive) timer = window.setTimeout(load, POLL_MS);
    };
    load();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.clearTimeout(clear);
    };
  }, [code]);

  // Rotating join PIN, shown only to admin / organizer (a 401/403 hides the block).
  useEffect(() => {
    let alive = true;
    setPin(null);
    const load = () =>
      api
        .eventPin(code)
        .then((r) => alive && setPin({ pin: r.pin, left: r.expires_in }))
        .catch(() => alive && setPin(null));
    load();
    const refetch = window.setInterval(load, 60000);
    const tick = window.setInterval(() => {
      setPin((p) => {
        if (!p) return p;
        if (p.left <= 1) {
          load();
          return { ...p, left: 5 }; // retry soon if the refetch is slow
        }
        return { ...p, left: p.left - 1 };
      });
    }, 1000);
    return () => {
      alive = false;
      window.clearInterval(refetch);
      window.clearInterval(tick);
    };
  }, [code]);

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    setNodes(null);
    setState("ok");
    api
      .event(code)
      .then((e) => {
        if (!alive) return;
        setEvent(e);
        storageSet("lastEvent", e.code);
      })
      .catch((e) => alive && setState(e instanceof ApiError && e.status === 404 ? "notfound" : "error"));
    const load = async () => {
      try {
        const g = await api.eventGraph(code);
        api.eventLocations(code).then((c) => alive && setPlaces(c)).catch(() => {});
        if (!alive) return;
        setNodes(g.nodes);
        setState("ok");
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) return setState("notfound");
        setState("error");
      }
      if (alive) timer = window.setTimeout(load, POLL_MS);
    };
    load();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [code]);

  const switcher = (
    <form
      className="screen-switch"
      onSubmit={(e) => {
        e.preventDefault();
        if (codeInput.trim()) go({ name: "screen", code: codeInput.trim().toUpperCase() });
      }}
    >
      <label className="field-label" htmlFor="screen-code">
        {t.screenCode}
      </label>
      <input id="screen-code" className="mono" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} autoCapitalize="characters" />
      <Button type="submit" variant="ghost" size="sm">
        →
      </Button>
    </form>
  );

  if (state === "notfound")
    return (
      <div className="page">
        <div className="state-box" role="alert">
          <p>{t.eventNotFound}</p>
          {switcher}
        </div>
      </div>
    );

  const counts = GOALS.map((g) => ({ goal: g, label: t.goals[g], n: (nodes ?? []).filter((n) => n.goal === g).length }));

  return (
    <div className="screen">
      <section className="screen-join">
        <h1>{event?.title ?? "…"}</h1>
        {event && eventWhen(event) && <p className="muted">{eventWhen(event)}</p>}
        <p className="screen-scan">{t.screenScan}</p>
        <div className="qr-frame">{event && <img src={api.eventQrUrl(event.code)} alt={event.join_url} />}</div>
        <p className="screen-code">
          <span className="muted">{t.screenCode}</span> <strong className="mono">{code}</strong>
        </p>
        {event && <p className="qr-url mono">{event.join_url}</p>}
        {pin && (
          <div className="screen-pin">
            <p className="screen-pin-hint">
              {t.screenLaptop} <strong className="mono">{window.location.host}/pin</strong>
            </p>
            <p className="screen-pin-digits mono" aria-label={pin.pin}>
              {pin.pin.slice(0, 3)} {pin.pin.slice(3)}
            </p>
            <p className="screen-pin-left muted mono">
              {t.pinNewIn} {Math.floor(pin.left / 60)}:{String(pin.left % 60).padStart(2, "0")}
            </p>
          </div>
        )}
        {!pin && (
          <a className="screen-pin-hint muted" href="#/admin">
            🔒 {t.pinNeedsAdmin}
          </a>
        )}
        {state === "error" && <p className="alert">{t.error}</p>}
      </section>

      <section className="screen-map">
        <div className="screen-stats">
          <LiveCounter label={t.inRoom} value={live?.counters.attendees ?? nodes?.length ?? null} icon={<span className="live-dot" data-error={state === "error"} />} />
          <LiveCounter label={t.liveMatches} value={live ? live.counters.mutual_pairs : null} tone="mutual" icon="♥" />
          <LiveCounter label={t.liveMeetings} value={live ? live.counters.meetings_accepted + live.counters.meetings_done : null} tone="meeting" icon="🤝" />
        </div>
        <div className="map-wrap">
          {nodes === null ? (
            <div className="map skeleton" />
          ) : nodes.length === 0 ? (
            <div className="map state-box">{t.screenEmpty}</div>
          ) : (
            <RoomMap
              nodes={nodes}
              meLabel={t.you}
              label={t.mapTitle}
              labelAll
              liveEdges={live?.edges}
              freshEdges={freshEdges}
              pulseIds={pulseIds}
            />
          )}
          <div className="map-legend" aria-hidden>
            <span data-kind="mutual">{t.legendMutual}</span>
            <span data-kind="meeting">{t.legendMeeting}</span>
          </div>
        </div>
        <div className="card screen-foot">
          <GoalBars counts={counts} label={t.byGoal} />
          {places.some((p) => p.count > 0) && (
            <ul className="screen-venue" aria-label={t.showOnProjector}>
              {places.map((p) => (
                <li key={p.name}>
                  {p.name} <strong className="mono">{p.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        {switcher}
      </section>
    </div>
  );
}
