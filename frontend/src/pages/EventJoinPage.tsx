import { AddToCalendar } from "../components/AddToCalendar";
import { eventCal, eventWhen } from "../eventTime";
import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import { ProfileForm } from "../components/ProfileForm";
import { Button, Spinner } from "../components/ui";
import type { Dict } from "../i18n";
import { session } from "../session";
import { EMPTY_PROFILE, storageSet, type Route } from "../state";
import type { EventInfo, Lang, MeOut, ProfileIn } from "../types";

type Props = { t: Dict; lang: Lang; code: string; go: (r: Route) => void };

type Load = { kind: "loading" } | { kind: "notfound" } | { kind: "error" } | { kind: "ok"; event: EventInfo; me: MeOut | null };

/** QR target: event landing + 60-second onboarding. */
export function EventJoinPage({ t, lang, code, go }: Props) {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [form, setForm] = useState<ProfileIn>({ ...EMPTY_PROFILE, lang });
  const [contact, setContact] = useState("");
  const [contactMissing, setContactMissing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const event = await api.event(code);
        let me: MeOut | null = null;
        if (session.get()) {
          try {
            me = await api.me();
          } catch (e) {
            if (e instanceof ApiError && (e.status === 401 || e.status === 404)) session.clear();
          }
        }
        if (!alive) return;
        // Already in this event: go straight to the matches.
        if (me?.events.some((e) => e.code === event.code)) return go({ name: "event", code: event.code });
        setLoad({ kind: "ok", event, me });
        setShowForm(!me);
      } catch (e) {
        if (alive) setLoad(e instanceof ApiError && e.status === 404 ? { kind: "notfound" } : { kind: "error" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [code]);

  async function join(withProfile: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await api.join(code, {
        lang,
        ...(withProfile ? { profile: { ...form, lang }, contact: /^[A-Za-z0-9_]{4,}$/.test(contact.trim()) ? `@${contact.trim()}` : contact.trim() } : {}),
      });
      session.set({ token: res.token || session.get()?.token || "", memberId: res.member_id, lastEvent: res.event.code });
      storageSet("lastEvent", res.event.code);
      go({ name: "event", code: res.event.code });
    } catch (e) {
      setError(e instanceof ApiError && e.detail === "event_closed" ? t.eventClosed : t.error);
      setBusy(false);
    }
  }

  if (load.kind === "loading")
    return (
      <div className="page">
        <p className="state-box">
          <Spinner /> {t.eventLoading}
        </p>
      </div>
    );
  if (load.kind !== "ok")
    return (
      <div className="page">
        <p className="state-box" role="alert">
          {load.kind === "notfound" ? t.eventNotFound : t.error}
        </p>
      </div>
    );

  const { event, me } = load;
  const closed = event.status === "closed";

  return (
    <div className="page">
      <header className="hero">
        <div className="event-meta">
          <span className="badge-code mono">{event.code}</span>
          {eventWhen(event, lang)}
          <span className="muted">· {t.attendees(event.attendee_count)}</span>
        </div>
        <h1>{event.title}</h1>
        <p className="sub">{t.eventJoinSub}</p>
        {eventCal(event) && <AddToCalendar event={eventCal(event)!} />}
      </header>

      {closed && <p className="alert">{t.eventClosed}</p>}

      {!closed && me && !showForm && (
        <div className="card continue">
          <Button type="button" onClick={() => join(false)} disabled={busy}>
            {busy ? <Spinner /> : null} {t.continueAs(me.profile.name)}
          </Button>
          <Button type="button" variant="link" onClick={() => setShowForm(true)}>
            {t.notYou}
          </Button>
        </div>
      )}

      {!closed && showForm && (
        <ProfileForm
          t={t}
          value={form}
          onChange={setForm}
          onSubmit={() => {
            if (!contact.trim()) {
              setContactMissing(true);
              document.getElementById("f-contact")?.focus();
              return;
            }
            session.clear(); // a new profile is a new member
            join(true);
          }}
          loading={busy}
          submitLabel={busy ? t.joining : t.joinCta}
          top={
          <div className="field">
            <label className="field-label" htmlFor="f-contact">
              {t.contact}
            </label>
            <input
              id="f-contact"
              maxLength={80}
              autoComplete="off"
              placeholder="@username"
              required
              aria-invalid={contactMissing && !contact.trim()}
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                setContactMissing(false);
              }}
            />
            {contactMissing && !contact.trim() ? (
              <span className="field-error">{t.required}</span>
            ) : (
              <span className="field-hint">{t.contactHint}</span>
            )}
          </div>
          }
        />
      )}

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

