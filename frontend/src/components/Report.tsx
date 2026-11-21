import { useEffect, useState } from "react";
import { api } from "../api";
import type { Dict } from "../i18n";
import type { EventReport, Goal } from "../types";
import { Button } from "./ui";
import { GoalBars } from "./RoomMap";

const PAIRS: [Goal, Goal][] = [
  ["find_job", "hire"],
  ["find_mentor", "be_mentor"],
];
const SOLO: Goal[] = ["find_cofounder", "exchange_experience"];

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Pure SVG bars: people who joined per 10-minute bucket. */
function JoinedChart({ t, data }: { t: Dict; data: EventReport["timeline"] }) {
  const W = 600;
  const H = 150;
  const base = H - 22;
  const max = Math.max(1, ...data.map((d) => d.joined));
  const step = W / Math.max(1, data.length);
  const bw = Math.max(2, Math.min(40, step - 3));
  const peak = data.reduce((a, d) => Math.max(a, d.joined), 0);
  if (data.length === 0 || peak === 0) return <p className="empty">{t.repJoinedEmpty}</p>;
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.repJoined} preserveAspectRatio="none">
        <line x1="0" x2={W} y1={base} y2={base} className="chart-axis" />
        {data.map((d, i) => {
          const h = d.joined === 0 ? 0 : Math.max(3, (d.joined / max) * (base - 14));
          const x = i * step + (step - bw) / 2;
          return (
            <g key={d.t} className="chart-bar" style={{ animationDelay: `${Math.min(i, 30) * 25}ms` }}>
              <rect x={x} y={base - h} width={bw} height={h} rx="3">
                <title>{`${hhmm(d.t)}: ${d.joined}`}</title>
              </rect>
              {d.joined === peak && (
                <text x={x + bw / 2} y={base - h - 4} textAnchor="middle" className="chart-val">
                  {d.joined}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span className="mono">{hhmm(data[0].t)}</span>
        <span className="muted">{t.repJoinedPeak(peak)}</span>
        <span className="mono">{hhmm(data[data.length - 1].t)}</span>
      </figcaption>
    </figure>
  );
}

/** Two-sided bar: who seeks (left) against who offers (right). */
function Pair({ t, a, b, counts }: { t: Dict; a: Goal; b: Goal; counts: Map<Goal, number> }) {
  const na = counts.get(a) ?? 0;
  const nb = counts.get(b) ?? 0;
  const max = Math.max(1, na, nb);
  return (
    <li className="sd">
      <div className={`sd-side goal-${a}`}>
        <span className="sd-name">{t.goals[a]}</span>
        <span className="sd-track sd-left">
          <span style={{ width: `${(na / max) * 100}%` }} />
        </span>
        <strong className="mono">{na}</strong>
      </div>
      <div className={`sd-side goal-${b}`}>
        <strong className="mono">{nb}</strong>
        <span className="sd-track">
          <span style={{ width: `${(nb / max) * 100}%` }} />
        </span>
        <span className="sd-name">{t.goals[b]}</span>
      </div>
    </li>
  );
}

function insightText(t: Dict, i: EventReport["insights"][number]): string {
  switch (i.code) {
    case "scarce_supply":
      return t.insightScarce(t.goals[i.params.plenty], i.params.plenty_count, t.goals[i.params.scarce], i.params.scarce_count, t.inviteWho[i.params.scarce]);
    case "top_location":
      return t.insightTop(i.params.name, i.params.meetings, i.params.now);
    case "low_matching":
      return t.insightLow(Math.round(i.params.matched_share * 100));
  }
}

/** Organizer report: KPIs, arrivals, goal balance, insights, venue and top connectors. Printable. */
export function ReportPanel({ t, eventId }: { t: Dict; eventId: string }) {
  const [r, setR] = useState<EventReport | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .report(eventId)
        .then((x) => {
          if (!alive) return;
          setR(x);
          setFailed(false);
        })
        .catch(() => alive && setFailed(true));
    load();
    const id = window.setInterval(load, 15000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [eventId]);

  if (!r)
    return failed ? (
      <p className="alert" role="alert">
        {t.error}
      </p>
    ) : (
      <div className="report">
        <div className="kpis">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="kpi skeleton-card" />
          ))}
        </div>
      </div>
    );

  const counts = new Map(r.by_goal.map((g) => [g.goal, g.count]));
  const maxLoc = Math.max(1, ...r.locations.map((l) => l.meetings));
  const kpis = [
    { label: t.repKpiAttendees, value: String(r.attendees), tone: "" },
    { label: t.repKpiMatched, value: `${Math.round(r.matched_share * 100)}%`, tone: "mutual" },
    { label: t.repKpiMatches, value: String(r.mutual_pairs), tone: "mutual" },
    { label: t.repKpiMeetings, value: String(r.meetings.done), tone: "meeting", sub: t.repMeetingsSub(r.meetings.accepted, r.meetings.proposed) },
  ];

  return (
    <div className="report" aria-live="polite">
      <div className="report-head">
        <div>
          <h2>{t.repTitle}</h2>
          <p className="muted print-only">{t.repPrinted(new Date().toLocaleString())}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="no-print" onClick={() => window.print()}>
          🖨 {t.repPrint}
        </Button>
      </div>

      <div className="kpis">
        {kpis.map((k) => (
          <div key={k.label} className="kpi" data-tone={k.tone || undefined}>
            <span className="kpi-label">{k.label}</span>
            <strong className="kpi-n mono">{k.value}</strong>
            {k.sub && <span className="muted small">{k.sub}</span>}
          </div>
        ))}
      </div>

      <div className="report-grid">
        <section className="card">
          <h3 className="card-title">{t.repJoined}</h3>
          <JoinedChart t={t} data={r.timeline} />
        </section>

        <section className="card">
          <h3 className="card-title">{t.repGoals}</h3>
          <ul className="sd-list">
            {PAIRS.map(([a, b]) => (
              <Pair key={a} t={t} a={a} b={b} counts={counts} />
            ))}
          </ul>
          <GoalBars label={t.repGoals} counts={SOLO.map((g) => ({ goal: g, label: t.goals[g], n: counts.get(g) ?? 0 }))} />
        </section>

        <section className="card insights">
          <h3 className="card-title">💡 {t.repInsights}</h3>
          {r.insights.length === 0 ? (
            <p className="ok-note">✓ {t.repNoInsights}</p>
          ) : (
            <ul>
              {r.insights.map((i) => (
                <li key={i.code} data-code={i.code}>
                  {insightText(t, i)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3 className="card-title">{t.repLocations}</h3>
          {r.locations.length === 0 ? (
            <p className="empty">—</p>
          ) : (
            <ul className="rep-locs">
              {r.locations.map((l) => (
                <li key={l.name}>
                  <div className="rep-loc-row">
                    <span>📍 {l.name}</span>
                    <span className="muted small">
                      <strong className="mono">{l.meetings}</strong> {t.repMeetingsWord} · <strong className="mono">{l.now}</strong> {t.repNowWord}
                    </span>
                  </div>
                  <span className="bar-track">
                    <span className="bar-fill accent" style={{ width: `${(l.meetings / maxLoc) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card report-wide">
          <h3 className="card-title">🏅 {t.repConnectors}</h3>
          {r.top_connectors.length === 0 ? (
            <p className="empty">{t.repConnectorsEmpty}</p>
          ) : (
            <ol className="connectors">
              {r.top_connectors.map((c, i) => (
                <li key={c.id}>
                  <span className="rank mono">{i + 1}</span>
                  <div className="who">
                    <strong>{c.name}</strong>
                    <span className="muted">{c.role}</span>
                  </div>
                  <span className="tag">{t.repMutualN(c.mutual)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
