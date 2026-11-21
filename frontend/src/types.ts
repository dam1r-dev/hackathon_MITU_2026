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
}

export interface Profile extends ProfileIn {
  id: string;
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
}

export interface MutualOut {
  profile: Profile;
  contact: string | null;
}

export interface LocationState {
  location: string | null;
  at: string | null;
}

export interface MeOut {
  profile: Profile;
  system_role: SystemRole;
  contact: string | null;
  events: EventInfo[];
  /** event id -> my current location (fresh only) */
  locations: Record<string, LocationState>;
}

export interface OpenEvent {
  code: string;
  title: string;
  date: string;
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
