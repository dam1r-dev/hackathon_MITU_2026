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
  meet?: { state: "idle" | "waiting" | "mutual"; contact?: string | null; verified?: boolean; onClick: () => void };
  /** Event mode: turn the match into a real meeting. `open` is set while a proposed/accepted meeting exists. */
  meetNow?: { open: boolean; onClick: () => void };
  isNew?: boolean;
};

/** Whole minutes since an ISO time (never negative). */
export const minutesAgo = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));

/** A contact shown after a mutual match: "✓" when it is the linked Telegram account, a muted note otherwise. */
export function ContactValue({ t, contact, verified }: { t: Dict; contact?: string | null; verified?: boolean }) {
  if (!contact) return <span className="muted small">{t.noContact}</span>;
  return (
    <span className="contact-wrap">
      <strong className="mono contact">{contact}</strong>
      {verified ? (
        <span className="verified" title={t.contactVerified} aria-label={t.contactVerified}>
          ✓
        </span>
      ) : (
        <span className="unverified">{t.contactUnverified}</span>
      )}
    </span>
  );
}

export function MatchCard({ t, m, rank, busy, onFeedback, meet, meetNow, isNew }: Props) {
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
          {p.goal === "hire" && p.wanted_role && (
            <div className="hiring-line">
              {t.hiringBadge}: <strong>{p.wanted_role}</strong>
            </div>
          )}
          <GoalBadge goal={p.goal}>{t.goals[p.goal]}</GoalBadge>
          {p.github && (
            <a className="gh-badge" href={`https://github.com/${encodeURIComponent(p.github)}`} target="_blank" rel="noreferrer" title={t.ghBadgeTitle}>
              ✓ GitHub @{p.github}
            </a>
          )}
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
          <div className="meet-row">
            {meet.state === "idle" && (
              <Button type="button" variant={meetNow ? "ghost" : "primary"} disabled={busy} onClick={meet.onClick}>
                ♥ {t.wantMeet}
              </Button>
            )}
            {meetNow && (
              <Button type="button" disabled={busy || meetNow.open} onClick={meetNow.onClick}>
                {meetNow.open ? `✓ ${t.meetInvited}` : `📍 ${t.meetNow}`}
              </Button>
            )}
          </div>
          {meet.state === "waiting" && <p className="meet-note">⏳ {t.meetWaiting}</p>}
          {meet.state === "mutual" && (
            <p className="meet-note">
              🎉 {t.meetMutual}{" "}
              <ContactValue t={t} contact={meet.contact} verified={meet.verified} />
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
