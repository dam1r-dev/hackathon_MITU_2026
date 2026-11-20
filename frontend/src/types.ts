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
