import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { GoalBars, RoomMap } from "../components/RoomMap";
import { Avatar, Button, GoalBadge } from "../components/ui";
import type { Dict } from "../i18n";
import type { Matcher } from "../state";
import { GOALS, type Goal, type GraphNode, type Profile } from "../types";

const POLL_MS = 4000;

type Props = { t: Dict; matcher: Matcher; onFind: () => void };

/** Room map + organizer stats. Polls the backend so people joining via QR appear live. */
export function MapPage({ t, matcher, onFind }: Props) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Goal | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    const load = async () => {
      try {
        const [g, ps] = await Promise.all([api.graph(), api.profiles()]);
        if (!alive) return;
        setNodes(g.nodes);
        setProfiles(Object.fromEntries(ps.map((p) => [p.id, p])));
        setError(false);
      } catch {
        if (alive) setError(true);
      }
      if (alive) timer = window.setTimeout(load, POLL_MS);
    };
    load();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  const matches = matcher.matches ?? [];
  const counts = GOALS.map((g) => ({ goal: g, label: t.goals[g], n: nodes.filter((n) => n.goal === g).length }));

  const topTags = useMemo(() => {
    const c = new Map<string, { label: string; n: number }>();
    Object.values(profiles).forEach((p) =>
      new Set([...p.interests, ...p.stack].map((s) => s.trim()).filter(Boolean)).forEach((tag) => {
        const k = tag.toLowerCase();
        const cur = c.get(k);
        c.set(k, { label: cur?.label ?? tag, n: (cur?.n ?? 0) + 1 });
      }),
    );
    return [...c.values()].sort((a, b) => b.n - a.n).slice(0, 8);
  }, [profiles]);
  const maxTag = Math.max(1, ...topTags.map((x) => x.n));

  const sel = selected ? profiles[selected] : undefined;
  const loading = !nodes.length && !error;

  return (
    <div className="page page-wide">
      <header className="hero hero-row">
        <div>
          <h1>{t.mapTitle}</h1>
          <p className="sub">{t.mapSubtitle}</p>
        </div>
        <div className="live" data-error={error}>
          <span className="live-dot" /> {t.live} · {t.attendees(nodes.length)}
        </div>
      </header>

      {error && <p className="alert" role="alert">{t.error}</p>}

      <div className="map-layout">
        <section className="card map-card" aria-busy={loading}>
          <div className="goal-filter" role="group" aria-label={t.byGoal}>
            <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              {t.allGoals}
            </button>
            {GOALS.map((g) => (
              <button key={g} type="button" className={`goal-${g}`} aria-pressed={filter === g} onClick={() => setFilter(filter === g ? "all" : g)}>
                <span className="dot" /> {t.goals[g]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="map skeleton" />
          ) : (
            <RoomMap
              nodes={nodes}
              highlights={matches.map((m) => ({ id: m.profile.id, score: m.score }))}
              meId={matcher.viewerId}
              meLabel={t.you}
              label={t.mapTitle}
              filter={filter}
              selected={selected}
              onSelect={setSelected}
            />
          )}

          {!matches.length && !loading && (
            <div className="map-hint">
              <span>{t.mapHint}</span>
              <Button type="button" size="sm" onClick={onFind}>
                {t.navFind}
              </Button>
            </div>
          )}

          {sel && (
            <div className="person">
              <Avatar name={sel.name} goal={sel.goal} size={40} />
              <div className="who">
                <strong>{sel.name}</strong>
                <span className="muted">
                  {sel.role} · {t.years(sel.experience_years)}
                </span>
                <GoalBadge goal={sel.goal}>{t.goals[sel.goal]}</GoalBadge>
                {sel.about && <p className="person-about">{sel.about}</p>}
                <div className="tags">
                  {[...sel.stack, ...sel.interests].map((x) => (
                    <span className="tag" key={x}>
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="map-side">
          <section className="card">
            <h2 className="card-title">{t.byGoal}</h2>
            <GoalBars counts={counts} />
          </section>

          <section className="card">
            <h2 className="card-title">{t.topTags}</h2>
            <ul className="bars">
              {topTags.map((x) => (
                <li key={x.label}>
                  <span className="bar-label">{x.label}</span>
                  <span className="bar-track">
                    <span className="bar-fill accent" style={{ width: `${(x.n / maxTag) * 100}%` }} />
                  </span>
                  <span className="bar-n mono">{x.n}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
