import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import { GoalBars, RoomMap } from "../components/RoomMap";
import { Button } from "../components/ui";
import type { Dict } from "../i18n";
import { storageSet, type Route } from "../state";
import { GOALS, type EventInfo, type GraphNode } from "../types";

const POLL_MS = 4000;

type Props = { t: Dict; code: string; go: (r: Route) => void };

/** Projector: big QR, live counter, room map of this event (names are initials, the route is public). */
export function ScreenPage({ t, code, go }: Props) {
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [nodes, setNodes] = useState<GraphNode[] | null>(null);
  const [state, setState] = useState<"ok" | "notfound" | "error">("ok");
  const [codeInput, setCodeInput] = useState(code);

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
        <p className="screen-scan">{t.screenScan}</p>
        <div className="qr-frame">{event && <img src={api.eventQrUrl(event.code)} alt={event.join_url} />}</div>
        <p className="screen-code">
          <span className="muted">{t.screenCode}</span> <strong className="mono">{code}</strong>
        </p>
        {event && <p className="qr-url mono">{event.join_url}</p>}
        <div className="screen-counter" aria-live="polite">
          <span className="live-dot" data-error={state === "error"} />
          <strong className="mono">{nodes?.length ?? "–"}</strong>
          <span>{t.inRoom}</span>
        </div>
        {state === "error" && <p className="alert">{t.error}</p>}
      </section>

      <section className="screen-map">
        {nodes === null ? (
          <div className="map skeleton" />
        ) : nodes.length === 0 ? (
          <div className="map state-box">{t.screenEmpty}</div>
        ) : (
          <RoomMap nodes={nodes} meLabel={t.you} label={t.mapTitle} labelAll />
        )}
        <div className="card">
          <GoalBars counts={counts} label={t.byGoal} />
        </div>
        {switcher}
      </section>
    </div>
  );
}
