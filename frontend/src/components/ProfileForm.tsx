import type { Dict } from "../i18n";
import { GOALS, type ProfileIn } from "../types";
import { TagInput } from "./TagInput";

const STACK_SUGGESTIONS = ["Python", "TypeScript", "React", "Go", "Java", "Kotlin", "SQL", "Figma", "PyTorch", "Kubernetes"];
const INTEREST_SUGGESTIONS = ["LLM agents", "fintech", "edtech", "healthcare", "e-commerce", "data", "startups", "open source"];

export const EXAMPLE: ProfileIn = {
  name: "Aigerim Sultanova",
  role: "Junior frontend developer",
  stack: ["TypeScript", "React", "CSS"],
  experience_years: 1,
  interests: ["edtech", "LLM agents"],
  about: "Finished a bootcamp last year, built two pet projects. Looking for my first full-time frontend role.",
  goal: "find_job",
  lang: "ru",
};

type Props = {
  t: Dict;
  value: ProfileIn;
  onChange: (p: ProfileIn) => void;
  onSubmit: () => void;
  loading: boolean;
};

export function ProfileForm({ t, value, onChange, onSubmit, loading }: Props) {
  const set = <K extends keyof ProfileIn>(k: K, v: ProfileIn[K]) => onChange({ ...value, [k]: v });

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <button type="button" className="link" onClick={() => onChange({ ...EXAMPLE, lang: value.lang })}>
        {t.example}
      </button>

      <fieldset className="goals">
        <legend>{t.goal}</legend>
        <div className="goal-grid">
          {GOALS.map((g) => (
            <label key={g} className={`goal goal-${g}`} data-active={value.goal === g}>
              <input type="radio" name="goal" value={g} checked={value.goal === g} onChange={() => set("goal", g)} />
              <span className="goal-title">{t.goals[g]}</span>
              <span className="goal-hint">{t.goalHints[g]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="row">
        <div className="field">
          <label htmlFor="f-name">{t.name}</label>
          <input id="f-name" required value={value.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-role">{t.role}</label>
          <input id="f-role" required value={value.role} onChange={(e) => set("role", e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-stack">{t.stack}</label>
        <TagInput id="f-stack" value={value.stack} onChange={(v) => set("stack", v)} suggestions={STACK_SUGGESTIONS} placeholder={t.tagHint} />
      </div>

      <div className="field">
        <label htmlFor="f-exp">
          {t.experience}: <strong>{t.years(value.experience_years)}</strong>
        </label>
        <input
          id="f-exp"
          type="range"
          min={0}
          max={20}
          value={value.experience_years}
          onChange={(e) => set("experience_years", Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label htmlFor="f-int">{t.interests}</label>
        <TagInput id="f-int" value={value.interests} onChange={(v) => set("interests", v)} suggestions={INTEREST_SUGGESTIONS} placeholder={t.tagHint} />
      </div>

      <div className="field">
        <label htmlFor="f-about">{t.about}</label>
        <textarea id="f-about" rows={3} placeholder={t.aboutHint} value={value.about} onChange={(e) => set("about", e.target.value)} />
      </div>

      <button className="primary" disabled={loading}>
        {loading ? t.loading : t.submit}
      </button>
    </form>
  );
}
