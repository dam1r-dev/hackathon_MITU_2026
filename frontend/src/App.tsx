import { useState } from "react";
import { api } from "./api";
import { dict } from "./i18n";
import { GOALS, type Lang, type Match, type ProfileIn } from "./types";

const empty: ProfileIn = {
  name: "",
  role: "",
  stack: [],
  experience_years: 0,
  interests: [],
  about: "",
  goal: "find_job",
  lang: "en",
};

const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function App() {
  const [lang] = useState<Lang>("en");
  const t = dict[lang];
  const [form, setForm] = useState<ProfileIn>(empty);
  const [stackText, setStackText] = useState("");
  const [interestsText, setInterestsText] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [tookMs, setTookMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.recommend(
        { ...form, stack: split(stackText), interests: split(interestsText), lang },
        lang,
      );
      setMatches(res.matches);
      setTookMs(res.took_ms);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>{t.title}</h1>
      <p className="sub">{t.subtitle}</p>

      <form onSubmit={submit}>
        <label>
          {t.name}
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>
          {t.role}
          <input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </label>
        <label>
          {t.stack} ({t.stackHint})
          <input value={stackText} onChange={(e) => setStackText(e.target.value)} />
        </label>
        <label>
          {t.experience}
          <input
            type="number"
            min={0}
            value={form.experience_years}
            onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })}
          />
        </label>
        <label>
          {t.interests} ({t.stackHint})
          <input value={interestsText} onChange={(e) => setInterestsText(e.target.value)} />
        </label>
        <label>
          {t.about}
          <textarea rows={3} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
        </label>
        <label>
          {t.goal}
          <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value as ProfileIn["goal"] })}>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {t.goals[g]}
              </option>
            ))}
          </select>
        </label>
        <button disabled={loading}>{loading ? t.loading : t.submit}</button>
      </form>

      {error && <p className="error">{error}</p>}

      {matches && (
        <section className="results">
          <h2>
            {t.results} <span className="muted">{t.tookMs(tookMs)}</span>
          </h2>
          {matches.map((m) => (
            <article className="card" key={m.profile.id}>
              <h3>{m.profile.name}</h3>
              <div className="muted">
                {m.profile.role} · {t.goals[m.profile.goal]} · {Math.round(m.score * 100)}%
              </div>
              <div className="tags">
                {m.shared_tags.map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </div>
              <p>{m.explanation}</p>
              <p className="muted">{t.youGive}: {m.you_give}</p>
              <p className="muted">{t.theyGive}: {m.they_give}</p>
              <p className="muted">{t.icebreaker}: {m.icebreaker}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
