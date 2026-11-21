import { useEffect, useState } from "react";
import { api } from "../api";
import type { Dict } from "../i18n";
import type { EventForecast, ForecastTip } from "../types";
import { GoalBars } from "./RoomMap";
import { PAIRS, Pair, SOLO } from "./Report";

const pct = (x: number) => Math.round(x * 100);

function tipText(t: Dict, tip: ForecastTip): string {
  switch (tip.code) {
    case "scarce_supply": {
      const p = tip.params;
      return t.insightScarce(t.goals[p.plenty], p.plenty_count, t.goals[p.scarce], p.scarce_count, t.inviteWho[p.scarce]);
    }
    case "stack_gap":
      return t.tipStackGap(tip.params.stack, tip.params.seekers, tip.params.hirers);
    case "stack_cluster":
      return t.tipStackCluster(tip.params.stack, tip.params.count, pct(tip.params.share));
    case "mostly_junior":
      return t.tipMostlyJunior(pct(tip.params.share));
    case "no_pair": {
      // Who to invite: the reciprocal side of the stranded goal.
      const other = { find_job: "hire", hire: "find_job", find_mentor: "be_mentor", be_mentor: "find_mentor" } as const;
      const g = tip.params.goal;
      const who = g in other ? t.inviteWho[other[g as keyof typeof other]] : t.inviteWho[g];
      return t.tipNoPair(tip.params.count, t.goals[g], who);
    }
    case "cofounder_thin":
      return t.tipCofounderThin(tip.params.count);
    case "few_registered":
      return t.tipFewRegistered(tip.params.count);
  }
}

/** Horizontal bars for one breakdown (stacks, roles, levels, languages). */
function Bars({ title, rows }: { title: string; rows: { key: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="card">
      <h3 className="card-title">{title}</h3>
      {rows.length === 0 ? (
        <p className="empty">—</p>
      ) : (
        <ul className="rep-locs">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="rep-loc-row">
                <span>{r.label}</span>
                <strong className="mono">{r.count}</strong>
              </div>
              <span className="bar-track">
                <span className="bar-fill accent" style={{ width: `${(r.count / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Pre-event forecast: who registered, will they find a pair, and what the organizer should do. */
export function ForecastPanel({ t, eventId }: { t: Dict; eventId: string }) {
  const [f, setF] = useState<EventForecast | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .forecast(eventId)
        .then((x) => {
          if (!alive) return;
          setF(x);
          setFailed(false);
        })
        .catch(() => alive && setFailed(true));
    load();
    const id = window.setInterval(load, 30000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [eventId]);

  if (!f)
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

  const head = (
    <div className="report-head">
      <div>
        <h2>{t.fcTitle}</h2>
        <p className="muted">{t.fcSub}</p>
      </div>
    </div>
  );

  if (f.attendees === 0)
    return (
      <div className="report">
        {head}
        <p className="empty">{t.fcEmpty}</p>
      </div>
    );

  const counts = new Map(f.by_goal.map((g) => [g.goal, g.count]));
  const top = f.stacks[0];
  const kpis = [
    { label: t.fcKpiRegistered, value: String(f.attendees), tone: "" },
    { label: t.fcKpiWithPair, value: `${pct(f.pairs.with_pair / f.attendees)}%`, tone: "mutual", sub: String(f.pairs.with_pair) },
    { label: t.fcKpiWithout, value: String(f.pairs.without_pair), tone: f.pairs.without_pair ? "meeting" : "" },
    { label: t.fcKpiTopStack, value: top ? top.name : "—", tone: "", sub: top ? `${top.count} / ${f.attendees}` : undefined },
  ];

  return (
    <div className="report" aria-live="polite">
      {head}

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
        <section className="card insights report-wide">
          <h3 className="card-title">💡 {t.fcTips}</h3>
          {f.tips.length === 0 ? (
            <p className="ok-note">✓ {t.fcNoTips}</p>
          ) : (
            <ul>
              {f.tips.map((tip, i) => (
                <li key={`${tip.code}-${i}`} data-code={tip.code}>
                  {tipText(t, tip)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3 className="card-title">{t.fcGoals}</h3>
          <ul className="sd-list">
            {PAIRS.map(([a, b]) => (
              <Pair key={a} t={t} a={a} b={b} counts={counts} />
            ))}
          </ul>
          <GoalBars label={t.fcGoals} counts={SOLO.map((g) => ({ goal: g, label: t.goals[g], n: counts.get(g) ?? 0 }))} />
          {f.pairs.without_by_goal.length > 0 && (
            <p className="muted small">
              {t.fcWithoutBy}: {f.pairs.without_by_goal.map((w) => `${t.goals[w.goal]} — ${w.count}`).join(", ")}
            </p>
          )}
        </section>

        <Bars title={t.fcStacks} rows={f.stacks.map((s) => ({ key: s.name, label: s.name, count: s.count }))} />
        <Bars title={t.fcRoles} rows={f.roles.map((r) => ({ key: r.name, label: t.roleFamily[r.name], count: r.count }))} />
        <Bars title={t.fcLevels} rows={f.levels.map((l) => ({ key: l.name, label: t.levelName[l.name], count: l.count }))} />
        <Bars title={t.fcLangs} rows={f.langs.map((l) => ({ key: l.name, label: t.langName[l.name], count: l.count }))} />
      </div>
    </div>
  );
}
