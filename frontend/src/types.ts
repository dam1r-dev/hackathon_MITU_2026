// Mirror docs/CONTRACT.md. Change the contract first.
export type Goal =
  | "find_job"
  | "hire"
  | "find_mentor"
  | "be_mentor"
  | "find_cofounder"
  | "exchange_experience";

export type Lang = "kk" | "ru" | "en";

export const GOALS: Goal[] = [
  "find_job",
  "hire",
  "find_mentor",
  "be_mentor",
  "find_cofounder",
  "exchange_experience",
];

export interface ProfileIn {
  name: string;
  role: string;
  stack: string[];
  experience_years: number;
  interests: string[];
  about: string;
  goal: Goal;
  lang: Lang;
  /** Goal "hire": who the employer needs (vacancy title). stack/experience_years/about then describe the vacancy. */
  wanted_role?: string | null;
}

export interface Profile extends ProfileIn {
  id: string;
  /** GitHub login confirmed through the bio check. Absent or null when not confirmed. */
  github?: string | null;
}

export interface Match {
  profile: Profile;
  score: number;
  shared_tags: string[];
  you_give: string;
  they_give: string;
  explanation: string;
  icebreaker: string;
  /** Event matches only: current venue location, when fresh (< 90 min). */
  location?: string | null;
  location_at?: string | null;
  /** "similar": goals don't match, the profiles are close (fallback in small events). */
  kind?: "similar" | null;
}

export interface RecommendResponse {
  took_ms: number;
  matches: Match[];
}

export interface GraphNode {
  id: string;
  name: string;
  goal: Goal;
  cluster: number;
  x: number;
  y: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: { from: string; to: string; score: number }[];
}

// Events layer (docs/CONTRACT.md "Events, members, roles and access").
export type SystemRole = "admin" | "organizer" | "member";

export interface EventInfo {
  id: string;
  code: string;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  status: "open" | "closed";
  organizer_ids: string[];
  created_at: string;
  attendee_count: number;
  locations: string[];
  join_path: string;
  join_url: string;
}

export interface JoinResponse {
  member_id: string;
  token: string;
  event: EventInfo;
  took_ms: number;
  matches: Match[];
}

export interface MeetResponse {
  mutual: boolean;
  contact: string | null;
  /** true: the contact is the @username of their linked Telegram account */
  contact_verified: boolean;
}

export interface MutualOut {
  profile: Profile;
  contact: string | null;
  contact_verified: boolean;
}

export interface LocationState {
  location: string | null;
  at: string | null;
}

export interface MeOut {
  profile: Profile;
  system_role: SystemRole;
  contact: string | null;
  /** true: others see your linked Telegram @username instead of the typed contact */
  contact_verified: boolean;
  events: EventInfo[];
  /** event id -> my current location (fresh only) */
  locations: Record<string, LocationState>;
}

export interface OpenEvent {
  code: string;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  attendee_count: number;
}

export interface LocationCount {
  name: string;
  count: number;
}

export interface PublicStats {
  attendees: number;
  by_goal: { goal: Goal; count: number }[];
}

export interface Attendee {
  profile: Profile;
  system_role: SystemRole;
}

export interface MemberOut extends Attendee {
  events: string[];
}

export interface EventStats {
  attendees: number;
  by_goal: { goal: Goal; count: number }[];
  hints: { code: "scarce_supply"; scarce: Goal; plenty: Goal; scarce_count: number; plenty_count: number }[];
}

// Meet now, projector live feed, organizer report (docs/CONTRACT.md).
export type MeetingStatus = "proposed" | "accepted" | "declined" | "done";
export type InMinutes = 0 | 5 | 10 | 15;

export interface Meeting {
  id: string;
  direction: "incoming" | "outgoing";
  other: Profile;
  location: string;
  /** ISO time of the meeting */
  at: string;
  status: MeetingStatus;
}

export interface LiveEdge {
  from: string;
  to: string;
  kind: "mutual" | "meeting";
  at: string | null;
}

export interface LiveFeed {
  edges: LiveEdge[];
  counters: { attendees: number; mutual_pairs: number; meetings_accepted: number; meetings_done: number };
}

export interface EventReport {
  attendees: number;
  matched_share: number;
  mutual_pairs: number;
  meetings: { proposed: number; accepted: number; done: number };
  timeline: { t: string; joined: number }[];
  by_goal: { goal: Goal; count: number }[];
  insights: (
    | { code: "scarce_supply"; params: { scarce: Goal; plenty: Goal; scarce_count: number; plenty_count: number } }
    | { code: "top_location"; params: { name: string; meetings: number; now: number } }
    | { code: "low_matching"; params: { matched_share: number } }
  )[];
  locations: { name: string; now: number; meetings: number }[];
  top_connectors: { id: string; name: string; role: string; mutual: number }[];
  telegram?: { on: boolean; linked: number };
}

export interface GithubProfile {
  login: string;
  name: string;
  about: string;
  stack: string[];
  interests: string[];
  experience_years: number;
  avatar_url: string;
  repos: number;
}

export interface TelegramSummaryResult {
  sent: number;
  linked: number;
}

/** GET /api/events/{id}/forecast: who registered so far and tips for the organizer. */
export type RoleFamily = "backend" | "frontend" | "mobile" | "data" | "devops" | "design" | "product" | "qa" | "security" | "management" | "other";
export type Level = "junior" | "middle" | "senior" | "lead";
export type ForecastTip =
  | { code: "scarce_supply"; params: { scarce: Goal; plenty: Goal; scarce_count: number; plenty_count: number } }
  | { code: "stack_gap"; params: { stack: string; seekers: number; hirers: number } }
  | { code: "stack_cluster"; params: { stack: string; count: number; share: number } }
  | { code: "mostly_junior"; params: { share: number } }
  | { code: "no_pair"; params: { count: number; goal: Goal } }
  | { code: "cofounder_thin"; params: { count: number } }
  | { code: "few_registered"; params: { count: number } };

export interface EventForecast {
  attendees: number;
  by_goal: { goal: Goal; count: number }[];
  stacks: { name: string; count: number }[];
  roles: { name: RoleFamily; count: number }[];
  levels: { name: Level; count: number }[];
  langs: { name: Lang; count: number }[];
  pairs: { with_pair: number; without_pair: number; without_by_goal: { goal: Goal; count: number }[] };
  tips: ForecastTip[];
}
