import { useEffect, useMemo, useRef, useState } from "react";
import type { Goal, GraphNode, LiveEdge } from "../types";

const PAD = 36;
const PHONE = "(max-width: 640px)";

/** Narrower canvas on phones so dots and labels stay readable after scaling. */
function useCanvas() {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE).matches);
  useEffect(() => {
    const m = window.matchMedia(PHONE);
    const on = () => setPhone(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return phone ? { W: 520, H: 600 } : { W: 1000, H: 640 };
}

/** Ids that appeared since the previous `nodes` value, cleared after a few seconds. */
export function useFresh(nodes: GraphNode[]) {
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!nodes.length) return;
    if (seen.current) {
      const added = nodes.filter((n) => !seen.current!.has(n.id)).map((n) => n.id);
      if (added.length) {
        setFresh(new Set(added));
        const id = window.setTimeout(() => setFresh(new Set()), 4000);
        seen.current = new Set(nodes.map((n) => n.id));
        return () => window.clearTimeout(id);
      }
    }
    seen.current = new Set(nodes.map((n) => n.id));
  }, [nodes]);
  return fresh;
}

type Props = {
  nodes: GraphNode[];
  /** People to highlight (your top 5), with match score for edge width. */
  highlights?: { id: string; score: number }[];
  /** Your own node id, if you are on the map. */
  meId?: string | null;
  meLabel: string;
  label: string;
  filter?: Goal | "all";
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  /** Projector mode: show every node's label (names are initials there). */
  labelAll?: boolean;
  /** Projector: live links between people (mutual interest, meetings). */
  liveEdges?: LiveEdge[];
  /** Keys (see edgeKey) of links that just appeared: they animate in. */
  freshEdges?: Set<string>;
  /** Node ids that pulse (ends of a new link). */
  pulseIds?: Set<string>;
};

export const edgeKey = (e: Pick<LiveEdge, "from" | "to" | "kind">) => `${[e.from, e.to].sort().join("|")}|${e.kind}`;

const firstName = (name: string) => name.split(/\s+/)[0] ?? name;

export function RoomMap({ nodes, highlights = [], meId, meLabel, label, filter = "all", selected, onSelect, labelAll, liveEdges = [], freshEdges, pulseIds }: Props) {
  const { W, H } = useCanvas();
  const fresh = useFresh(nodes);
  // Coordinates come from the layout of everyone in the system; a small live room would sit in
  // one corner of it. Stretch the nodes we actually show to fill the canvas.
  const bounds = useMemo(() => {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const b = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    return nodes.length ? b : { x0: 0, x1: 1, y0: 0, y1: 1 };
  }, [nodes]);
  const fit = (v: number, lo: number, hi: number) => (hi - lo < 1e-6 ? 0.5 : 0.06 + (0.88 * (v - lo)) / (hi - lo));
  const px = (n: GraphNode) => PAD + fit(n.x, bounds.x0, bounds.x1) * (W - PAD * 2);
  const py = (n: GraphNode) => PAD + fit(n.y, bounds.y0, bounds.y1) * (H - PAD * 2);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const top = highlights.filter((h) => byId.has(h.id));
  const topIds = new Set(top.map((h) => h.id));

  // "You": your node if you are on the map, else the centre of your matches.
  let me: { x: number; y: number; id: string | null } | null = null;
  const own = meId ? byId.get(meId) : undefined;
  if (own) me = { x: px(own), y: py(own), id: own.id };
  else if (top.length) {
    const pts = top.map((h) => byId.get(h.id)!);
    me = { x: pts.reduce((s, n) => s + px(n), 0) / pts.length, y: pts.reduce((s, n) => s + py(n), 0) / pts.length, id: null };
  }

  const dimmed = (n: GraphNode) =>
    (filter !== "all" && n.goal !== filter) || (topIds.size > 0 && !topIds.has(n.id) && n.id !== me?.id);
  const rank = (n: GraphNode) => Number(topIds.has(n.id) || n.id === me?.id);
  const ordered = [...nodes].sort((a, b) => rank(a) - rank(b));

  return (
    <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onClick={() => onSelect?.(null)}>
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" className="map-grid" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#grid)" />

      {me &&
        top.map((h) => {
          const n = byId.get(h.id)!;
          return (
            <line key={`e-${n.id}`} className="map-edge" x1={me!.x} y1={me!.y} x2={px(n)} y2={py(n)} strokeWidth={1.5 + h.score * 3} />
          );
        })}

      {liveEdges.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const [x1, y1, x2, y2] = [px(a), py(a), px(b), py(b)];
        // Meetings bow slightly so a pair that is both mutual and meeting shows two lines.
        const bend = e.kind === "meeting" ? 0.12 : 0;
        const cx = (x1 + x2) / 2 - (y2 - y1) * bend;
        const cy = (y1 + y2) / 2 + (x2 - x1) * bend;
        const key = edgeKey(e);
        return (
          <path
            key={key}
            className="live-edge"
            data-kind={e.kind}
            data-fresh={freshEdges?.has(key) || undefined}
            d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
            pathLength={1}
          />
        );
      })}

      {ordered.map((n) => {
        const hi = topIds.has(n.id);
        const isMe = n.id === me?.id;
        const r = isMe ? 0 : hi ? 12 : labelAll ? 9 : 6;
        const showLabel = !isMe && (hi || selected === n.id || labelAll);
        return (
          <g
            key={n.id}
            className={`map-node goal-${n.goal}`}
            data-dim={dimmed(n)}
            data-hi={hi}
            data-fresh={fresh.has(n.id)}
            data-selected={selected === n.id}
            transform={`translate(${px(n)} ${py(n)})`}
            tabIndex={onSelect && hi ? 0 : -1}
            role={onSelect ? "button" : undefined}
            aria-label={n.name}
            onClick={(e) => {
              if (!onSelect) return;
              e.stopPropagation();
              onSelect(n.id === selected ? null : n.id);
            }}
            onKeyDown={(e) => onSelect && (e.key === "Enter" || e.key === " ") && onSelect(n.id)}
          >
            {r > 0 && onSelect && <circle className="hit" r={Math.max(r, 12)} />}
            {r > 0 && pulseIds?.has(n.id) && <circle className="node-ring" r={r} />}
            {r > 0 && <circle className="dotc" r={r} />}
            {showLabel && (
              <text className="map-label" y={-r - 7} textAnchor="middle">
                {labelAll ? n.name : firstName(n.name)}
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
            {meLabel}
          </text>
        </g>
      )}
    </svg>
  );
}

/** Horizontal bars: count per goal. */
export function GoalBars({ counts, label }: { counts: { goal: Goal; label: string; n: number }[]; label?: string }) {
  const max = Math.max(1, ...counts.map((c) => c.n));
  return (
    <ul className="bars" aria-label={label}>
      {counts.map((c) => (
        <li key={c.goal} className={`goal-${c.goal}`}>
          <span className="bar-label">{c.label}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(c.n / max) * 100}%` }} />
          </span>
          <span className="bar-n mono">{c.n}</span>
        </li>
      ))}
    </ul>
  );
}
