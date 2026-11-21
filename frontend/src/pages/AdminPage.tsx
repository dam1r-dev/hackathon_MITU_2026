import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api";
import { GoalBars } from "../components/RoomMap";
import { TagInput } from "../components/TagInput";
import { Avatar, Button, GoalBadge, Segmented, Spinner } from "../components/ui";
import type { Dict } from "../i18n";
import { adminSession, session } from "../session";
import { href, type Route } from "../state";
import { GOALS, type Attendee, type EventInfo, type EventStats, type Goal, type MemberOut, type SystemRole } from "../types";

type Role = "admin" | "organizer";
type Auth = { kind: "loading" } | { kind: "out" } | { kind: "in"; role: Role };

/** Who is using the panel: admin (code or admin member) or organizer (member token). */
function useAdminAuth() {
  const [auth, setAuth] = useState<Auth>({ kind: "loading" });
  const check = useCallback(async () => {
    let memberRole: SystemRole = "member";
    if (session.get()) {
      try {
        memberRole = (await api.me()).system_role;
      } catch {
        /* not a member here */
      }
    }
    if (adminSession.get() && memberRole !== "admin") {
      try {
        await api.members(); // admin-only: proves the admin token is still valid
        return setAuth({ kind: "in", role: "admin" });
      } catch {
        adminSession.clear(); // backend restarted or wrong token
      }
    }
    if (memberRole === "admin" || memberRole === "organizer") return setAuth({ kind: "in", role: memberRole });
    setAuth({ kind: "out" });
  }, []);
  useEffect(() => {
    check();
  }, [check]);
  return { auth, recheck: check };
}

const errText = (t: Dict, e: unknown) =>
  e instanceof ApiError && e.status === 403 ? t.forbidden : e instanceof ApiError && e.detail === "code_taken" ? t.codeTaken : t.error;

type Props = { t: Dict; eventId?: string; go: (r: Route) => void };

export function AdminPage({ t, eventId, go }: Props) {
  const { auth, recheck } = useAdminAuth();

  if (auth.kind === "loading")
    return (
      <div className="page">
        <p className="state-box">
          <Spinner />
        </p>
      </div>
    );
  if (auth.kind === "out") return <AdminLogin t={t} onDone={recheck} />;

  const signOut = () => {
    adminSession.clear();
    recheck();
  };
  return (
    <div className="page page-wide">
      <div className="admin-bar">
        <span className="muted">{t.signedInAs(t.roles[auth.role])}</span>
        {adminSession.get() && (
          <Button type="button" variant="link" onClick={signOut}>
            {t.signOut}
          </Button>
        )}
      </div>
      {eventId ? <AdminEvent t={t} role={auth.role} eventId={eventId} go={go} /> : <AdminEvents t={t} role={auth.role} />}
    </div>
  );
}

function AdminLogin({ t, onDone }: { t: Dict; onDone: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="page narrow">
      <header className="hero">
        <h1>{t.adminTitle}</h1>
      </header>
      <form
        className="card form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!code.trim()) return;
          setBusy(true);
          setError(null);
          try {
            adminSession.set((await api.adminLogin(code.trim())).token);
            onDone();
          } catch (err) {
            setError(err instanceof ApiError && err.status === 401 ? t.wrongCode : t.error);
            setBusy(false);
          }
        }}
      >
        <div className="field">
          <label className="field-label" htmlFor="admin-code">
            {t.adminCode}
          </label>
          <input
            id="admin-code"
            type="password"
            autoComplete="current-password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={!!error}
            autoFocus
          />
          {error && <span className="field-error">{error}</span>}
          <span className="field-hint">{t.adminCodeHint}</span>
        </div>
        <Button type="submit" disabled={busy || !code.trim()}>
          {busy && <Spinner />} {t.signIn}
        </Button>
      </form>
    </div>
  );
}

// ------------------------------------------------------------------ events list

function AdminEvents({ t, role }: { t: Dict; role: Role }) {
  const [events, setEvents] = useState<EventInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api
      .events()
      .then((es) => {
        setEvents(es);
        setError(null);
      })
      .catch((e) => setError(errText(t, e)));
  }, [t]);
  useEffect(load, [load]);

  return (
    <>
      <header className="hero hero-row">
        <h1>{t.eventsTitle}</h1>
        {role === "admin" && !creating && (
          <Button type="button" onClick={() => setCreating(true)}>
            + {t.createEvent}
          </Button>
        )}
      </header>

      {creating && (
        <CreateEvent
          t={t}
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {!events && !error && (
        <div className="results">
          <div className="card skeleton-card short" />
          <div className="card skeleton-card short" />
        </div>
      )}
      {events && events.length === 0 && <p className="empty">{role === "admin" ? t.noEvents : t.orgNoEvents}</p>}
      {events && events.length > 0 && (
        <div className="event-grid">
          {events.map((e) => (
            <EventCard key={e.id} t={t} e={e} role={role} onChange={load} />
          ))}
        </div>
      )}
    </>
  );
}

function CreateEvent({ t, onCancel, onCreated }: { t: Dict; onCancel: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", date: "", venue: "", code: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeOk = !form.code || /^[A-Za-z0-9]{4,12}$/.test(form.code);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form
      className="card form create-event"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !codeOk) return;
        setBusy(true);
        setError(null);
        try {
          await api.createEvent({
            title: form.title.trim(),
            date: form.date,
            venue: form.venue.trim(),
            ...(form.code ? { code: form.code.toUpperCase() } : {}),
          });
          onCreated();
        } catch (err) {
          setError(errText(t, err));
          setBusy(false);
        }
      }}
    >
      <h2 className="card-title">{t.createEvent}</h2>
      <div className="field">
        <label className="field-label" htmlFor="ev-title">
          {t.eventTitle}
        </label>
        <input id="ev-title" required maxLength={120} value={form.title} onChange={set("title")} placeholder="Qazaq IT Meetup" autoFocus />
      </div>
      <div className="row">
        <div className="field">
          <label className="field-label" htmlFor="ev-date">
            {t.eventDate}
          </label>
          <input id="ev-date" type="date" value={form.date} onChange={set("date")} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="ev-venue">
            {t.eventVenue}
          </label>
          <input id="ev-venue" value={form.venue} onChange={set("venue")} placeholder="Almaty" />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="ev-code">
          {t.eventCodeOpt}
        </label>
        <input
          id="ev-code"
          className="mono upper"
          maxLength={12}
          value={form.code}
          onChange={set("code")}
          aria-invalid={!codeOk}
          placeholder="MEETUP26"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <span className={codeOk ? "field-hint" : "field-error"}>{codeOk ? t.eventCodeHint : t.codeInvalid}</span>
      </div>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          ✕
        </Button>
        <Button type="submit" disabled={busy || !form.title.trim() || !codeOk}>
          {busy && <Spinner />} {t.createEvent}
        </Button>
      </div>
    </form>
  );
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("", text); // clipboard blocked (plain http): let them copy by hand
    }
  };
  return { copied, copy };
}

function StatusPill({ t, status }: { t: Dict; status: EventInfo["status"] }) {
  return (
    <span className="status" data-status={status}>
      {status === "open" ? t.statusOpen : t.statusClosed}
    </span>
  );
}

function EventCard({ t, e, role, onChange }: { t: Dict; e: EventInfo; role: Role; onChange: () => void }) {
  const { copied, copy } = useCopy();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      onChange();
    } catch {
      /* list reload shows the truth */
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card event-card">
      <header>
        <span className="badge-code mono">{e.code}</span>
        <StatusPill t={t} status={e.status} />
      </header>
      <h2>{e.title}</h2>
      <p className="muted">
        {[e.date, e.venue].filter(Boolean).join(" · ") || "—"} · {t.attendees(e.attendee_count)}
      </p>
      <div className="event-actions">
        <a className="btn btn-primary btn-sm" href={href({ name: "admin", code: e.id })}>
          {t.manage}
        </a>
        <a className="btn btn-ghost btn-sm" href={href({ name: "screen", code: e.code })}>
          {t.projector}
        </a>
        <Button type="button" variant="ghost" size="sm" onClick={() => copy(e.join_url)}>
          {copied ? `✓ ${t.copied}` : t.copyLink}
        </Button>
      </div>
      <footer className="event-actions secondary">
        <Button
          type="button"
          variant="link"
          disabled={busy}
          onClick={() => run(() => api.patchEvent(e.id, { status: e.status === "open" ? "closed" : "open" }))}
        >
          {e.status === "open" ? t.closeReg : t.openReg}
        </Button>
        {role === "admin" && (
          <Button
            type="button"
            variant="link"
            className="danger"
            disabled={busy}
            onClick={() => window.confirm(t.confirmDeleteEvent(e.title)) && run(() => api.deleteEvent(e.id))}
          >
            {t.del}
          </Button>
        )}
      </footer>
    </article>
  );
}

// ------------------------------------------------------------------ one event

function AdminEvent({ t, role, eventId, go }: { t: Dict; role: Role; eventId: string; go: (r: Route) => void }) {
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [people, setPeople] = useState<Attendee[] | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  const load = useCallback(async () => {
    try {
      const [es, as, st] = await Promise.all([api.events(), api.attendees(eventId), api.stats(eventId)]);
      setEvent(es.find((e) => e.id === eventId) ?? null);
      setPeople(as);
      setStats(st);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? t.eventNotFound : errText(t, e));
    }
  }, [eventId, t]);

  // Refresh while the panel is open: people keep joining by QR.
  useEffect(() => {
    load();
    const id = window.setInterval(load, 6000);
    return () => window.clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!people) return [];
    if (!q) return people;
    return people.filter(({ profile: p }) =>
      [p.name, p.role, ...p.stack, ...p.interests].some((x) => x.toLowerCase().includes(q)),
    );
  }, [people, query]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(errText(t, e));
    } finally {
      setBusyId(null);
    }
  };

  const counts = GOALS.map((g) => ({ goal: g, label: t.goals[g], n: stats?.by_goal.find((x) => x.goal === g)?.count ?? 0 }));

  return (
    <>
      <Button type="button" variant="link" onClick={() => go({ name: "admin" })}>
        ← {t.allEvents}
      </Button>

      <header className="hero hero-row">
        <div>
          {event && (
            <div className="event-meta">
              <span className="badge-code mono">{event.code}</span>
              <StatusPill t={t} status={event.status} />
              {[event.date, event.venue].filter(Boolean).join(" · ")}
            </div>
          )}
          <h1>{event?.title ?? "…"}</h1>
        </div>
        {event && (
          <div className="event-actions">
            <a className="btn btn-ghost btn-sm" href={href({ name: "screen", code: event.code })}>
              {t.projector}
            </a>
            <Button type="button" variant="ghost" size="sm" onClick={() => copy(event.join_url)}>
              {copied ? `✓ ${t.copied}` : t.copyLink}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busyId === "status"}
              onClick={() => act("status", () => api.patchEvent(event.id, { status: event.status === "open" ? "closed" : "open" }))}
            >
              {event.status === "open" ? t.closeReg : t.openReg}
            </Button>
          </div>
        )}
      </header>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <div className="admin-layout">
        <section className="admin-main">
          <div className="results-head">
            <h2>
              {t.attendeesTitle} <span className="muted mono">{people?.length ?? ""}</span>
            </h2>
          </div>
          <input
            type="search"
            className="search"
            placeholder={t.search}
            aria-label={t.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {!people && !error && <div className="card skeleton-card" />}
          {people && people.length === 0 && <p className="empty">{t.noAttendees}</p>}
          {people && people.length > 0 && filtered.length === 0 && <p className="empty">{t.noResults}</p>}
          {filtered.length > 0 && (
            <ul className="people card" aria-busy={busyId !== null}>
              {filtered.map(({ profile: p, system_role }) => (
                <li key={p.id}>
                  <Avatar name={p.name} goal={p.goal} size={36} />
                  <div className="who">
                    <strong>{p.name}</strong>
                    <span className="muted">
                      {p.role} · {t.years(p.experience_years)}
                    </span>
                  </div>
                  <GoalBadge goal={p.goal}>{t.goals[p.goal]}</GoalBadge>
                  {role === "admin" ? (
                    <select
                      className="role-select"
                      aria-label={`${t.access}: ${p.name}`}
                      value={system_role}
                      disabled={busyId === p.id}
                      onChange={(e) => act(p.id, () => api.setRole(p.id, e.target.value as SystemRole))}
                    >
                      {(["member", "organizer", "admin"] as const).map((r) => (
                        <option key={r} value={r}>
                          {t.roles[r]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="tag">{t.roles[system_role]}</span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="danger"
                    disabled={busyId === p.id}
                    aria-label={`${t.remove}: ${p.name}`}
                    onClick={() => window.confirm(t.confirmRemove(p.name)) && act(p.id, () => api.removeAttendee(eventId, p.id))}
                  >
                    {t.remove}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="admin-side">
          <section className="card">
            <h2 className="card-title">{t.balance}</h2>
            {stats && (
              <>
                {stats.hints.length > 0 ? (
                  <ul className="hints">
                    {stats.hints.map((h) => (
                      <li key={`${h.scarce}-${h.plenty}`} className={`goal-${h.scarce}`}>
                        ⚠ {t.hintScarce(t.goals[h.scarce], h.scarce_count, t.goals[h.plenty], h.plenty_count)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ok-note">✓ {t.balanced}</p>
                )}
                <GoalBars counts={counts} label={t.balance} />
              </>
            )}
          </section>

          {event && <LocationsEditor t={t} event={event} onSaved={load} />}

          <AddAttendee t={t} role={role} eventId={eventId} present={new Set(people?.map((a) => a.profile.id))} onAdded={load} />
        </aside>
      </div>
    </>
  );
}

function LocationsEditor({ t, event, onSaved }: { t: Dict; event: EventInfo; onSaved: () => void }) {
  const [text, setText] = useState(event.locations.join("\n"));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<"saved" | "error" | null>(null);
  const names = text.split("\n").map((x) => x.trim()).filter(Boolean);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await api.patchEvent(event.id, { locations: names });
      setMsg("saved");
      onSaved();
    } catch {
      setMsg("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card loc-editor">
      <h2 className="card-title">{t.venueLocations}</h2>
      <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-label={t.venueLocations} />
      <span className="field-hint">{t.venueLocationsHint}</span>
      <div className="edit-actions">
        <Button type="button" size="sm" disabled={busy || names.length < 1 || names.length > 12} onClick={save}>
          {t.saveProfile}
        </Button>
        {msg === "saved" && <span className="ok-note">✓ {t.saved}</span>}
        {msg === "error" && <span className="alert">{t.error}</span>}
      </div>
    </section>
  );
}

function AddAttendee({ t, role, eventId, present, onAdded }: { t: Dict; role: Role; eventId: string; present: Set<string>; onAdded: () => void }) {
  // Listing members is admin-only, so organizers can only create a new profile.
  const [mode, setMode] = useState<"existing" | "new">(role === "admin" ? "existing" : "new");
  const [members, setMembers] = useState<MemberOut[] | null>(null);
  const [memberId, setMemberId] = useState("");
  const [p, setP] = useState({ name: "", role: "", goal: "find_job" as Goal, experience_years: 0, stack: [] as string[] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role === "admin" && mode === "existing" && !members) api.members().then(setMembers).catch(() => setMembers([]));
  }, [role, mode, members]);

  const candidates = (members ?? []).filter((m) => !present.has(m.profile.id)).sort((a, b) => a.profile.name.localeCompare(b.profile.name));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "existing") {
        if (!memberId) return;
        await api.addAttendee(eventId, { member_id: memberId });
        setMemberId("");
      } else {
        if (!p.name.trim() || !p.role.trim()) return;
        await api.addAttendee(eventId, {
          profile: { ...p, name: p.name.trim(), role: p.role.trim(), interests: [], about: "", lang: "ru" },
        });
        setP({ ...p, name: "", role: "", stack: [] });
      }
      onAdded();
    } catch (err) {
      setError(errText(t, err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form add-attendee" onSubmit={submit}>
      <h2 className="card-title">{t.addAttendee}</h2>
      {role === "admin" && (
        <Segmented
          label={t.addAttendee}
          value={mode}
          onChange={setMode}
          options={[
            { value: "existing", label: t.existingMember },
            { value: "new", label: t.newProfile },
          ]}
        />
      )}

      {mode === "existing" ? (
        <div className="field">
          <label className="field-label" htmlFor="add-member">
            {t.pickMember}
          </label>
          <select id="add-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} disabled={!members}>
            <option value="">—</option>
            {candidates.map((m) => (
              <option key={m.profile.id} value={m.profile.id}>
                {m.profile.name} · {m.profile.role} · {t.goals[m.profile.goal]}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="field">
            <label className="field-label" htmlFor="add-name">
              {t.name}
            </label>
            <input id="add-name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="add-role">
              {t.role}
            </label>
            <input id="add-role" value={p.role} placeholder={t.rolePlaceholder} onChange={(e) => setP({ ...p, role: e.target.value })} />
          </div>
          <div className="row">
            <div className="field">
              <label className="field-label" htmlFor="add-goal">
                {t.goal}
              </label>
              <select id="add-goal" value={p.goal} onChange={(e) => setP({ ...p, goal: e.target.value as Goal })}>
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {t.goals[g]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="add-exp">
                {t.experience}
              </label>
              <input
                id="add-exp"
                type="number"
                min={0}
                max={50}
                value={p.experience_years}
                onChange={(e) => setP({ ...p, experience_years: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="add-stack">
              {t.stack}
            </label>
            <TagInput id="add-stack" value={p.stack} onChange={(stack) => setP({ ...p, stack })} placeholder={t.tagHint} />
          </div>
        </>
      )}

      {error && <span className="field-error">{error}</span>}
      <Button
        type="submit"
        disabled={busy || (mode === "existing" ? !memberId : !p.name.trim() || !p.role.trim())}
      >
        {busy && <Spinner />} {t.add}
      </Button>
    </form>
  );
}
