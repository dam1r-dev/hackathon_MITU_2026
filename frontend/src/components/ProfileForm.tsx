import { useState, type ReactNode } from "react";
import { api, ApiError } from "../api";
import type { Dict } from "../i18n";
import { GOALS, type ProfileIn } from "../types";
import { TagInput } from "./TagInput";
import { Button, Spinner } from "./ui";

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

export const HIRE_EXAMPLE: ProfileIn = {
  name: "Dana Karimova",
  role: "HR, Kaspi.kz",
  wanted_role: "Junior frontend developer",
  stack: ["React", "TypeScript"],
  experience_years: 1,
  interests: ["fintech"],
  about: "Office in Almaty, hybrid. Junior role: building the web cabinet, mentor in the team.",
  goal: "hire",
  lang: "ru",
};

type Props = {
  t: Dict;
  value: ProfileIn;
  onChange: (p: ProfileIn) => void;
  onSubmit: () => void;
  loading: boolean;
  /** Extra fields shown before the submit button (e.g. contact on event join). */
  children?: ReactNode;
  submitLabel?: string;
  /** Editing an existing profile: no "fill with an example" link. */
  hideExample?: boolean;
};

const mergeTags = (have: string[], add: string[]) => {
  const seen = new Set(have.map((x) => x.toLowerCase()));
  return [...have, ...add.filter((x) => !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase()))];
};

/** Compact "fill from GitHub" row. Hidden for employers (they describe a vacancy). */
function GithubFill({ t, value, onChange }: { t: Dict; value: ProfileIn; onChange: (p: ProfileIn) => void }) {
  const [user, setUser] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ avatar: string; langs: number; topics: number } | null>(null);

  const run = async () => {
    const u = user.trim().replace(/^@/, "");
    if (!u || busy) return;
    setBusy(true);
    setErr("");
    setDone(null);
    try {
      const g = await api.github(u);
      onChange({
        ...value,
        name: value.name.trim() ? value.name : g.name,
        stack: mergeTags(value.stack, g.stack),
        about: value.about.trim() ? value.about : g.about.slice(0, 400),
        interests: mergeTags(value.interests, g.interests),
        experience_years: value.experience_years === 0 ? g.experience_years : value.experience_years,
      });
      setDone({ avatar: g.avatar_url, langs: g.stack.length, topics: g.interests.length });
    } catch (e) {
      setErr(e instanceof ApiError && (e.status === 404 || e.status === 422) ? t.ghNotFound : t.ghLater);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gh-fill">
      <div className="gh-row">
        <svg className="gh-icon" viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <input
          className="gh-input"
          aria-label={t.ghPlaceholder}
          placeholder={t.ghPlaceholder}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={40}
          value={user}
          onChange={(e) => setUser(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void run();
            }
          }}
        />
        <Button type="button" variant="ghost" size="sm" disabled={busy || !user.trim()} onClick={() => void run()}>
          {busy ? t.ghFilling : t.ghFill}
        </Button>
      </div>
      {done && (
        <p className="gh-ok" role="status">
          {done.avatar && <img src={done.avatar} alt="" width={20} height={20} />}
          <span>✓ {t.ghDone(done.langs, done.topics)}</span>
        </p>
      )}
      {err && (
        <p className="field-error" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}

export function ProfileForm({ t, value, onChange, onSubmit, loading, children, submitLabel, hideExample }: Props) {
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof ProfileIn>(k: K, v: ProfileIn[K]) => onChange({ ...value, [k]: v });
  const hire = value.goal === "hire";
  const missing = { name: !value.name.trim(), role: !value.role.trim(), wanted: hire && !(value.wanted_role ?? "").trim() };

  return (
    <form
      className="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (missing.name || missing.role || missing.wanted) {
          document.getElementById(missing.name ? "f-name" : missing.role ? "f-role" : "f-wanted")?.focus();
          return;
        }
        onSubmit();
      }}
    >
      {!hideExample && (
        <Button type="button" variant="link" onClick={() => onChange({ ...(hire ? HIRE_EXAMPLE : EXAMPLE), lang: value.lang })}>
          ✦ {t.example}
        </Button>
      )}

      {!hire && <GithubFill t={t} value={value} onChange={onChange} />}

      <fieldset>
        <legend className="field-label">{t.goal}</legend>
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
          <label className="field-label" htmlFor="f-name">
            {t.name}
          </label>
          <input
            id="f-name"
            autoComplete="name"
            aria-invalid={touched && missing.name}
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
          />
          {touched && missing.name && <span className="field-error">{t.required}</span>}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="f-role">
            {hire ? t.roleHire : t.role}
          </label>
          <input
            id="f-role"
            autoComplete="organization-title"
            placeholder={hire ? t.roleHirePlaceholder : t.rolePlaceholder}
            aria-invalid={touched && missing.role}
            value={value.role}
            onChange={(e) => set("role", e.target.value)}
          />
          {touched && missing.role && <span className="field-error">{t.required}</span>}
        </div>
      </div>

      {hire && (
        <div className="field">
          <label className="field-label" htmlFor="f-wanted">
            {t.wantedRole}
          </label>
          <input
            id="f-wanted"
            maxLength={80}
            placeholder={t.wantedRolePlaceholder}
            aria-invalid={touched && missing.wanted}
            value={value.wanted_role ?? ""}
            onChange={(e) => set("wanted_role", e.target.value)}
          />
          {touched && missing.wanted && <span className="field-error">{t.required}</span>}
        </div>
      )}

      <div className="field">
        <label className="field-label" htmlFor="f-stack">
          {hire ? t.stackHire : t.stack}
        </label>
        <TagInput id="f-stack" value={value.stack} onChange={(v) => set("stack", v)} suggestions={STACK_SUGGESTIONS} placeholder={t.tagHint} />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="f-exp">
          {hire ? t.experienceHire : t.experience}:{" "}
          <strong>{hire ? t.fromYears(value.experience_years) : t.years(value.experience_years)}</strong>
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
        <label className="field-label" htmlFor="f-int">
          {t.interests}
        </label>
        <TagInput id="f-int" value={value.interests} onChange={(v) => set("interests", v)} suggestions={INTEREST_SUGGESTIONS} placeholder={t.tagHint} />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="f-about">
          {hire ? t.aboutHire : t.about}
        </label>
        <textarea id="f-about" rows={3} maxLength={400} placeholder={hire ? t.aboutHireHint : t.aboutHint} value={value.about} onChange={(e) => set("about", e.target.value)} />
      </div>

      {children}

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Spinner /> {t.loading}
          </>
        ) : (
          submitLabel ?? t.submit
        )}
      </Button>
    </form>
  );
}
