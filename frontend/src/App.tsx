import { useEffect, useState } from "react";
import { api } from "./api";
import { MatchCard } from "./components/MatchCard";
import { ProfileForm } from "./components/ProfileForm";
import { dict, LANGS } from "./i18n";
import type { Lang, Match, ProfileIn } from "./types";

const empty: ProfileIn = {
  name: "",
  role: "",
  stack: [],
  experience_years: 0,
  interests: [],
  about: "",
  goal: "find_job",
  lang: "ru",
};

function loadLang(): Lang {
  try {
    const v = localStorage.getItem("lang");
    if (v === "kk" || v === "ru" || v === "en") return v;
  } catch {
    /* storage unavailable */
  }
  return "ru";
}

export default function App() {
  const [lang, setLang] = useState<Lang>(loadLang);
  const t = dict[lang];
  const [form, setForm] = useState<ProfileIn>({ ...empty, lang: loadLang() });
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [tookMs, setTookMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  // Id of the viewer in the backend. Created lazily on the first feedback, because
  // /feedback needs a stored profile. Reset when the profile is edited.
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("lang", lang);
    } catch {
      /* storage unavailable */
    }
  }, [lang]);

  async function submit() {
    setLoading(true);
    setError(false);
    setViewerId(null);
    try {
      const res = await api.recommend({ ...form, lang }, lang);
      setMatches(res.matches);
      setTookMs(res.took_ms);
      requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function feedback(targetId: string, verdict: "met" | "not_fit") {
    setBusy(true);
    setError(false);
    try {
      let id = viewerId;
      if (!id) {
        id = (await api.addProfile({ ...form, lang })).id;
        setViewerId(id);
      }
      const res = await api.feedback(id, targetId, verdict);
      setMatches(res.matches);
      setTookMs(res.took_ms);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <nav className="topbar">
        <span className="brand">Meetup Matchmaker</span>
        <div className="langs" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l.code} type="button" data-active={lang === l.code} onClick={() => setLang(l.code)}>
              {l.label}
            </button>
          ))}
        </div>
      </nav>

      <header className="hero">
        <h1>{t.title}</h1>
        <p className="sub">{t.subtitle}</p>
      </header>

      <ProfileForm t={t} value={form} onChange={(p) => { setForm(p); setViewerId(null); }} onSubmit={submit} loading={loading} />

      {error && <p className="error">{t.error}</p>}

      {matches && (
        <section id="results" className="results">
          <div className="results-head">
            <h2>{t.results}</h2>
            <span className="muted">{t.tookMs(tookMs)}</span>
          </div>
          {matches.length === 0 && <p className="muted">{t.empty}</p>}
          {matches.map((m, i) => (
            <MatchCard key={m.profile.id} t={t} m={m} rank={i} busy={busy} onFeedback={(v) => feedback(m.profile.id, v)} />
          ))}
          <button type="button" className="link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            ↑ {t.edit}
          </button>
        </section>
      )}
    </div>
  );
}
