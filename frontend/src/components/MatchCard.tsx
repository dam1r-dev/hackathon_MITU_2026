import { useState } from "react";
import type { Dict } from "../i18n";
import type { Match } from "../types";

type Props = {
  t: Dict;
  m: Match;
  rank: number;
  busy: boolean;
  onFeedback: (verdict: "met" | "not_fit") => void;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export function MatchCard({ t, m, rank, busy, onFeedback }: Props) {
  const [copied, setCopied] = useState(false);
  const pct = Math.round(m.score * 100);
  const p = m.profile;

  async function copy() {
    try {
      await navigator.clipboard.writeText(m.icebreaker);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: ignore */
    }
  }

  return (
    <article className="card" style={{ animationDelay: `${rank * 60}ms` }}>
      <header className="card-head">
        <div className={`avatar goal-${p.goal}`} aria-hidden>
          {initials(p.name)}
        </div>
        <div className="who">
          <h3>{p.name}</h3>
          <div className="muted">
            {p.role} · {t.years(p.experience_years)}
          </div>
          <span className={`goal-badge goal-${p.goal}`}>{t.goals[p.goal]}</span>
        </div>
        <div className="score" style={{ ["--pct" as string]: pct }} title={`${pct}% ${t.match}`}>
          <span>{pct}</span>
        </div>
      </header>

      <p className="why">{m.explanation}</p>

      <div className="give">
        <div>
          <div className="label">{t.youGive}</div>
          <p>{m.you_give}</p>
        </div>
        <div>
          <div className="label">{t.theyGive}</div>
          <p>{m.they_give}</p>
        </div>
      </div>

      {m.shared_tags.length > 0 && (
        <div className="tags">
          {m.shared_tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="ice">
        <div className="label">{t.icebreaker}</div>
        <p>“{m.icebreaker}”</p>
        <button type="button" className="ghost small" onClick={copy}>
          {copied ? t.copied : t.copy}
        </button>
      </div>

      <footer className="actions">
        <button type="button" className="ghost" disabled={busy} onClick={() => onFeedback("met")}>
          ✓ {t.met}
        </button>
        <button type="button" className="ghost" disabled={busy} onClick={() => onFeedback("not_fit")}>
          ✕ {t.notFit}
        </button>
      </footer>
    </article>
  );
}
