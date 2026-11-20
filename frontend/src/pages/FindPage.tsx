import { MatchCard } from "../components/MatchCard";
import { ProfileForm } from "../components/ProfileForm";
import { Button } from "../components/ui";
import type { Dict } from "../i18n";
import type { Matcher } from "../state";

type Props = { t: Dict; matcher: Matcher; join: boolean; onShowMap: () => void };

export function FindPage({ t, matcher, join, onShowMap }: Props) {
  const { form, setForm, matches, tookMs, loading, busyId, error, submit, feedback, viewerId } = matcher;

  async function onSubmit() {
    await submit({ join });
    requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="page">
      <header className="hero">
        <h1>{join ? t.joinTitle : t.title}</h1>
        <p className="sub">{join ? t.joinSubtitle : t.subtitle}</p>
      </header>

      <ProfileForm t={t} value={form} onChange={setForm} onSubmit={onSubmit} loading={loading} />

      {error && (
        <p className="alert" role="alert">
          {t.error}
        </p>
      )}

      {matches && (
        <section id="results" className="results" aria-live="polite">
          <div className="results-head">
            <h2>{join && viewerId ? t.resultsJoined : t.results}</h2>
            <span className="muted mono">{t.tookMs(tookMs)}</span>
          </div>
          {matches.length === 0 && <p className="empty">{t.empty}</p>}
          {matches.length > 0 && matches.length < 5 && <p className="muted">{t.fewer(matches.length)}</p>}
          {matches.map((m, i) => (
            <MatchCard
              key={m.profile.id}
              t={t}
              m={m}
              rank={i}
              busy={busyId !== null}
              onFeedback={(v) => feedback(m.profile.id, v)}
            />
          ))}
          <div className="results-foot">
            {matches.length > 0 && (
              <Button type="button" variant="ghost" onClick={onShowMap}>
                ◎ {t.showOnMap}
              </Button>
            )}
            <Button type="button" variant="link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              ↑ {t.edit}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
