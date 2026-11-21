import { adminSession, session } from "./session";
import type {
  Attendee,
  EventInfo,
  EventReport,
  InMinutes,
  LiveFeed,
  Meeting,
  EventStats,
  LocationCount,
  LocationState,
  OpenEvent,
  PublicStats,
  MemberOut,
  SystemRole,
  GraphResponse,
  JoinResponse,
  Lang,
  MeOut,
  MeetResponse,
  MutualOut,
  Profile,
  ProfileIn,
  RecommendResponse,
} from "./types";

/** HTTP error with the backend's `detail` code (e.g. "event_closed", "sign_in_required"). */
export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`${status} ${detail}`);
  }
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = session.get()?.token;
  if (token) h["X-Member-Token"] = token;
  const admin = adminSession.get();
  if (admin) h["X-Admin-Token"] = admin;
  return h;
}

const get = <T>(url: string) => fetch(url, { headers: headers() }).then((r) => json<T>(r));
const post = <T>(url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then((r) => json<T>(r));

const send = <T>(method: string, url: string, body?: unknown) =>
  fetch(url, { method, headers: headers(), body: body === undefined ? undefined : JSON.stringify(body) }).then((r) =>
    r.status === 204 ? (undefined as T) : json<T>(r),
  );

const ev = (code: string) => `/api/events/by-code/${encodeURIComponent(code)}`;

export const api = {
  /** viewer_id (from addProfile) hides the viewer from their own results and applies their feedback. */
  recommend: (profile: ProfileIn, lang: Lang, viewer_id?: string | null) =>
    post<RecommendResponse>("/api/recommend", { profile, lang, ...(viewer_id ? { viewer_id } : {}) }),

  addProfile: (profile: ProfileIn) => post<{ id: string }>("/api/profiles", profile),

  profiles: () => get<Profile[]>("/api/profiles"),

  graph: (viewer?: string) => get<GraphResponse>(`/api/graph${viewer ? `?viewer=${encodeURIComponent(viewer)}` : ""}`),

  feedback: (viewer_id: string, target_id: string, verdict: "met" | "not_fit", event_code?: string) =>
    post<RecommendResponse>("/api/feedback", { viewer_id, target_id, verdict, ...(event_code ? { event_code } : {}) }),

  // Events (public)
  openEvents: () => get<OpenEvent[]>("/api/events/open"),
  eventStats: (code: string) => get<PublicStats>(`${ev(code)}/stats`),
  eventLocations: (code: string) => get<LocationCount[]>(`${ev(code)}/locations`),
  event: (code: string) => get<EventInfo>(ev(code)),
  eventQrUrl: (code: string) => `${ev(code)}/qr.svg`,
  eventLive: (code: string) => get<LiveFeed>(`${ev(code)}/live`),
  eventGraph: (code: string) => get<GraphResponse>(`${ev(code)}/graph`),
  join: (code: string, body: { profile?: ProfileIn; contact?: string; lang: Lang }) => post<JoinResponse>(`${ev(code)}/join`, body),

  // Events (member token)
  eventMatches: (code: string, lang: Lang) => get<RecommendResponse>(`${ev(code)}/matches?lang=${lang}`),
  meet: (code: string, target_id: string) => post<MeetResponse>(`${ev(code)}/meet`, { target_id }),
  mutual: (code: string) => get<MutualOut[]>(`${ev(code)}/mutual`),
  me: () => get<MeOut>("/api/me"),
  updateMe: (profile: ProfileIn, contact?: string | null) => send<MeOut>("PATCH", "/api/me", { profile, contact: contact ?? null }),
  meetings: (code: string) => get<Meeting[]>(`${ev(code)}/meetings`),
  proposeMeeting: (code: string, body: { target_id: string; location: string; in_minutes: InMinutes }) =>
    post<Meeting>(`${ev(code)}/meetings`, body),
  respondMeeting: (code: string, id: string, accept: boolean) => post<Meeting>(`${ev(code)}/meetings/${id}/respond`, { accept }),
  meetingDone: (code: string, id: string) => post<Meeting>(`${ev(code)}/meetings/${id}/done`, {}),
  setLocation: (code: string, location: string | null) => post<LocationState>(`${ev(code)}/location`, { location }),

  // Admin / organizer (X-Admin-Token or an organizer's X-Member-Token)
  adminLogin: (code: string) => post<{ token: string }>("/api/admin/login", { code }),
  eventPin: (code: string) => get<{ pin: string; expires_in: number }>(`${ev(code)}/pin`),
  resolvePin: (pin: string) => post<{ code: string }>("/api/pin", { pin }),
  events: () => get<EventInfo[]>("/api/events"),
  createEvent: (body: { title: string; date: string; venue: string; code?: string }) => post<EventInfo>("/api/events", body),
  patchEvent: (id: string, body: Partial<Pick<EventInfo, "title" | "date" | "venue" | "status" | "locations">>) =>
    send<EventInfo>("PATCH", `/api/events/${id}`, body),
  deleteEvent: (id: string) => send<void>("DELETE", `/api/events/${id}`),
  attendees: (id: string) => get<Attendee[]>(`/api/events/${id}/attendees`),
  addAttendee: (id: string, body: { member_id: string } | { profile: ProfileIn }) => post<Attendee>(`/api/events/${id}/attendees`, body),
  removeAttendee: (id: string, memberId: string) => send<void>("DELETE", `/api/events/${id}/attendees/${memberId}`),
  report: (id: string) => get<EventReport>(`/api/events/${id}/report`),
  stats: (id: string) => get<EventStats>(`/api/events/${id}/stats`),
  members: () => get<MemberOut[]>("/api/members"),
  setRole: (memberId: string, role: SystemRole) => send<Attendee>("PATCH", `/api/members/${memberId}/role`, { role }),
};
