import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { Avatar, Button, GoalBadge } from "../components/ui";
import type { Dict } from "../i18n";
import type { Matcher } from "../state";
import { GOALS, type Goal, type GraphNode, type Profile } from "../types";

const PAD = 36;
const POLL_MS = 4000;
const PHONE = "(max-width: 640px)";

/** Narrower canvas on phones so dots and labels stay readable after scaling. */
function useCanvas() {
  const mq = () => window.matchMedia(PHONE).matches;
  const [phone, setPhone] = useState(mq);
  useEffect(() => {
    const m = window.matchMedia(PHONE);
    const on = () => setPhone(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return phone ? { W: 520, H: 600 } : { W: 1000, H: 640 };
}
const firstName = (name: string) => name.split(/\s+/)[0] ?? name;

type Props = { t: Dict; matcher: Matcher; onFind: () => void };

/** Room map + organizer stats. Polls the backend so people joining via QR appear live. */
export function MapPage({ t, matcher, onFind }: Props) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Goal | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const seen = useRef<Set<string> | null>(null);
  const { W, H } = useCanvas();
  const px = (n: GraphNode) => PAD + n.x * (W - PAD * 2);
  const py = (n: GraphNode) => PAD + n.y * (H - PAD * 2);

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    const load = async () => {
      try {
        const [g, ps] = await Promise.all([api.graph(), api.profiles()]);
        if (!alive) return;
        // Highlight people who joined since the last poll.
        if (seen.current) {
          const added = g.nodes.filter((n) => !seen.current!.has(n.id)).map((n) => n.id);
          if (added.length) {
            setFresh(new Set(added));
            window.setTimeout(() => alive && setFresh(new Set()), 4000);
          }
        }
        seen.current = new Set(g.nodes.map((n) => n.id));
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

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const matches = matcher.matches ?? [];
  const top = matches.filter((m) => byId.has(m.profile.id));
  const topIds = new Set(top.map((m) => m.profile.id));

  // "You": your stored node if you joined, else the centre of your matches.
  const me = useMemo(() => {
    const own = matcher.viewerId ? byId.get(matcher.viewerId) : undefined;
    if (own) return { x: px(own), y: py(own), id: own.id };
    if (!top.length) return null;
    const pts = top.map((m) => byId.get(m.profile.id)!);
    return {
      x: pts.reduce((s, n) => s + px(n), 0) / pts.length,
      y: pts.reduce((s, n) => s + py(n), 0) / pts.length,
      id: null,
    };
  }, [byId, matcher.viewerId, top, W, H]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(GOALS.map((g) => [g, 0])) as Record<Goal, number>;
    nodes.forEach((n) => c[n.goal]++);
    return c;
  }, [nodes]);
  const maxCount = Math.max(1, ...Object.values(counts));

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
  const dimmed = (n: GraphNode) => (filter !== "all" && n.goal !== filter) || (topIds.size > 0 && !topIds.has(n.id) && n.id !== me?.id);
  // Draw highlighted nodes last so they sit on top.
  const ordered = [...nodes].sort((a, b) => Number(topIds.has(a.id) || a.id === me?.id) - Number(topIds.has(b.id) || b.id === me?.id));

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
        <section className="card map-card">
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

          <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.mapTitle} onClick={() => setSelected(null)}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" className="map-grid" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#grid)" />

            {me &&
              top.map((m) => {
                const n = byId.get(m.profile.id)!;
                return (
                  <line
                    key={`e-${n.id}`}
                    className="map-edge"
                    x1={me.x}
                    y1={me.y}
                    x2={px(n)}
                    y2={py(n)}
                    strokeWidth={1.5 + m.score * 3}
                  />
                );
              })}

            {ordered.map((n) => {
              const hi = topIds.has(n.id);
              const isMe = n.id === me?.id;
              const r = isMe ? 0 : hi ? 12 : 6;
              return (
                <g
                  key={n.id}
                  className={`map-node goal-${n.goal}`}
                  data-dim={dimmed(n)}
                  data-hi={hi}
                  data-fresh={fresh.has(n.id)}
                  data-selected={selected === n.id}
                  transform={`translate(${px(n)} ${py(n)})`}
                  tabIndex={hi ? 0 : -1}
                  role="button"
                  aria-label={n.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(n.id === selected ? null : n.id);
                  }}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(n.id)}
                >
                  {r > 0 && <circle className="hit" r={Math.max(r, 12)} />}
                  {r > 0 && <circle className="dotc" r={r} />}
                  {(hi || selected === n.id) && !isMe && (
                    <text className="map-label" y={-r - 7} textAnchor="middle">
                      {firstName(n.name)}
                    </text>
                  )}
                </g>
              );
            })}

            {me && (
              <g className="map-me" transform={`translate(${me.x} ${me.y})`}>
                <circle className="pulse" r="16" />
                <circle r="14" />
                <text y="4.5" textAnchor="middle">
                  {t.you}
                </text>
              </g>
            )}
          </svg>

          {!matches.length && (
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
            <ul className="bars">
              {GOALS.map((g) => (
                <li key={g} className={`goal-${g}`}>
                  <span className="bar-label">{t.goals[g]}</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${(counts[g] / maxCount) * 100}%` }} />
                  </span>
                  <span className="bar-n mono">{counts[g]}</span>
                </li>
              ))}
            </ul>
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
