import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import { ProfileForm } from "../components/ProfileForm";
import { Avatar, Button, Chip, GoalBadge, Segmented, Spinner } from "../components/ui";
import { LANGS, type Dict } from "../i18n";
import { session } from "../session";
import { href, type Route, type Theme } from "../state";
import type { Lang, MeOut, ProfileIn } from "../types";

type Props = { t: Dict; lang: Lang; setLang: (l: Lang) => void; theme: Theme; setTheme: (t: Theme) => void; go: (r: Route) => void };

/** My profile: initials avatar, goal badge, stack chips, languages, my events. */
export function ProfilePage({ t, lang, setLang, theme, setTheme, go }: Props) {
  const [me, setMe] = useState<MeOut | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "none" | "error">(session.get() ? "loading" : "none");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileIn | null>(null);
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  function startEdit() {
    if (!me) return;
    const { id: _id, ...rest } = me.profile; // eslint-disable-line @typescript-eslint/no-unused-vars
    setForm(rest);
    setContact(me.contact ?? "");
    setSaveError(false);
    setEditing(true);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setSaveError(false);
    try {
      setMe(await api.updateMe({ ...form, lang }, contact.trim()));
      setEditing(false);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!session.get()) return;
    api
      .me()
      .then((m) => {
        setMe(m);
        setState("ok");
      })
      .catch((e) => {
        if (e instanceof ApiError && (e.status === 401 || e.status === 404)) {
          session.clear();
          setState("none");
        } else setState("error");
      });
  }, []);

  const settings = (
    <div className="settings">
      <div className="field">
        <span className="field-label">{t.language}</span>
        <Segmented label={t.language} options={LANGS} value={lang} onChange={setLang} />
      </div>
      <div className="field">
        <span className="field-label">{t.appearance}</span>
        <Segmented
          label={t.appearance}
          value={theme}
          onChange={setTheme}
          options={(["system", "light", "dark"] as const).map((v) => ({ value: v, label: t.themes[v] }))}
        />
      </div>
    </div>
  );

  if (state === "loading")
    return (
      <div className="page">
        <p className="state-box">
          <Spinner />
        </p>
      </div>
    );

  if (state !== "ok" || !me)
    return (
      <div className="page">
        <header className="hero">
          <h1>{t.meTitle}</h1>
        </header>
        <div className="state-box">
          <p>{state === "error" ? t.error : t.meEmpty}</p>
          <Button type="button" variant="ghost" onClick={() => go({ name: "find" })}>
            {t.navFind}
          </Button>
        </div>
        <div className="profile-lang">{settings}</div>
      </div>
    );

  const p = me.profile;

  if (editing && form)
    return (
      <div className="page">
        <header className="hero">
          <h1>{t.editProfile}</h1>
        </header>
        <ProfileForm t={t} value={form} onChange={setForm} onSubmit={save} loading={saving} submitLabel={t.saveProfile} hideExample>
          <div className="field">
            <label className="field-label" htmlFor="f-contact">
              {t.contact}
            </label>
            <input id="f-contact" maxLength={80} autoComplete="off" placeholder="@telegram" value={contact} onChange={(e) => setContact(e.target.value)} />
            <span className="field-hint">{t.contactHint}</span>
          </div>
        </ProfileForm>
        {saveError && (
          <p className="alert" role="alert">
            {t.error}
          </p>
        )}
        <Button type="button" variant="link" className="forget" onClick={() => setEditing(false)}>
          {t.cancel}
        </Button>
      </div>
    );

  return (
    <div className="page">
      <header className="hero">
        <h1>{t.meTitle}</h1>
      </header>

      <section className="card profile">
        <div className="profile-head">
          <Avatar name={p.name} goal={p.goal} size={72} />
          <div className="who">
            <h2>{p.name}</h2>
            <span className="muted">
              {p.role} · {t.years(p.experience_years)}
            </span>
            <div className="ds-row">
              <GoalBadge goal={p.goal}>{t.goals[p.goal]}</GoalBadge>
              {me.system_role !== "member" && <span className="tag">{t.roles[me.system_role]}</span>}
            </div>
          </div>
        </div>

        {p.about && <p>{p.about}</p>}

        {p.stack.length > 0 && (
          <div className="field">
            <span className="field-label">{t.stack}</span>
            <div className="tags">
              {p.stack.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </div>
        )}
        {p.interests.length > 0 && (
          <div className="field">
            <span className="field-label">{t.interests}</span>
            <div className="tags">
              {p.interests.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </div>
        )}

        <div className="edit-actions">
          <Button type="button" variant="ghost" size="sm" onClick={startEdit}>
            ✎ {t.editProfile}
          </Button>
        </div>

        {settings}
      </section>

      {me.events.length > 0 && (
        <section className="results">
          <h2 className="card-title">{t.myEvents}</h2>
          {me.events.map((e) => (
            <div key={e.id} className="card event-row">
              <div className="who">
                <strong>{e.title}</strong>
                <span className="muted">
                  <span className="mono">{e.code}</span>
                  {[e.date, e.venue].filter(Boolean).map((x) => ` · ${x}`)} · {t.attendees(e.attendee_count)}
                </span>
              </div>
              <a className="btn btn-primary btn-sm" href={href({ name: "event", code: e.code })}>
                {t.openEvent}
              </a>
            </div>
          ))}
        </section>
      )}

      <Button
        type="button"
        variant="link"
        className="forget"
        onClick={() => {
          session.clear();
          setMe(null);
          setState("none");
        }}
      >
        {t.forget}
      </Button>
    </div>
  );
}
