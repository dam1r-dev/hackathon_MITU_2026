import { useState } from "react";
import type { Dict } from "../i18n";
import type { Match } from "../types";
import { Avatar, Button, GoalBadge, ScoreRing } from "./ui";

type Props = {
  t: Dict;
  m: Match;
  rank: number;
  busy: boolean;
  onFeedback: (verdict: "met" | "not_fit") => void;
  /** Event mode: "Want to meet" with mutual reveal of the contact. */
  meet?: { state: "idle" | "waiting" | "mutual"; contact?: string | null; onClick: () => void };
  isNew?: boolean;
};

/** Whole minutes since an ISO time (never negative). */
export const minutesAgo = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));

export function MatchCard({ t, m, rank, busy, onFeedback, meet, isNew }: Props) {
  const [copied, setCopied] = useState(false);
  const p = m.profile;

  async function copy() {
    try {
      await navigator.clipboard.writeText(m.icebreaker);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked (e.g. plain http on a phone): ignore */
    }
  }

  return (
    <article className="card match" data-new={isNew || undefined} style={{ animationDelay: `${rank * 60}ms` }} aria-busy={busy}>
      {isNew && <span className="new-badge">{t.newBadge}</span>}
      <header className="match-head">
        <Avatar name={p.name} goal={p.goal} />
        <div className="who">
          <h3>{p.name}</h3>
          <div className="muted">
            {p.role} · {t.years(p.experience_years)}
          </div>
          <GoalBadge goal={p.goal}>{t.goals[p.goal]}</GoalBadge>
          {m.kind === "similar" && <span className="similar-badge">{t.similarBadge}</span>}
          {m.location && (
            <div className="where">
              📍 {m.location}
              {m.location_at && ` · ${t.minAgo(minutesAgo(m.location_at))}`}
            </div>
          )}
        </div>
        <ScoreRing value={m.score} label={t.match} />
      </header>

      <p className="why">{m.explanation}</p>

      <div className="give">
        <div>
          <div className="eyebrow">{t.youGive}</div>
          <p>{m.you_give}</p>
        </div>
        <div>
          <div className="eyebrow">{t.theyGive}</div>
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
        <div className="eyebrow">{t.icebreaker}</div>
        <p>“{m.icebreaker}”</p>
        <Button type="button" variant="ghost" size="sm" onClick={copy} aria-live="polite">
          {copied ? `✓ ${t.copied}` : t.copy}
        </Button>
      </div>

      {meet && (
        <div className="meet" data-state={meet.state} aria-live="polite">
          {meet.state === "idle" && (
            <Button type="button" disabled={busy} onClick={meet.onClick}>
              ♥ {t.wantMeet}
            </Button>
          )}
          {meet.state === "waiting" && <p className="meet-note">⏳ {t.meetWaiting}</p>}
          {meet.state === "mutual" && (
            <p className="meet-note">
              🎉 {t.meetMutual}{" "}
              {meet.contact ? <strong className="mono">{meet.contact}</strong> : <span className="muted">{t.noContact}</span>}
            </p>
          )}
        </div>
      )}

      <footer className="actions">
        <Button type="button" variant="ghost" disabled={busy} onClick={() => onFeedback("met")}>
          ✓ {t.met}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => onFeedback("not_fit")}>
          ✕ {t.notFit}
        </Button>
      </footer>
    </article>
  );
}
