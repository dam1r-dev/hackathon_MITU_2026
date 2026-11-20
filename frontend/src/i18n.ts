import type { Goal, Lang } from "./types";

// All UI texts live here so kk/ru/en can be switched. Kazakh/Russian are TODO (English placeholders).
type Dict = {
  title: string;
  subtitle: string;
  name: string;
  role: string;
  stack: string;
  stackHint: string;
  experience: string;
  interests: string;
  about: string;
  goal: string;
  submit: string;
  loading: string;
  results: string;
  youGive: string;
  theyGive: string;
  icebreaker: string;
  tookMs: (n: number) => string;
  goals: Record<Goal, string>;
};

const en: Dict = {
  title: "Who should you meet?",
  subtitle: "Fill in a short profile and get 5 people worth meeting.",
  name: "Name",
  role: "Role",
  stack: "Stack",
  stackHint: "comma separated",
  experience: "Years of experience",
  interests: "Interests",
  about: "About you",
  goal: "Your goal",
  submit: "Find people",
  loading: "Matching...",
  results: "Your top 5",
  youGive: "You give",
  theyGive: "They give",
  icebreaker: "Icebreaker",
  tookMs: (n) => `${n} ms`,
  goals: {
    find_job: "Find a job",
    hire: "Hire",
    find_mentor: "Find a mentor",
    be_mentor: "Become a mentor",
    find_cofounder: "Find a co-founder",
    exchange_experience: "Exchange experience",
  },
};

export const dict: Record<Lang, Dict> = { en, ru: en, kk: en }; // TODO: translate ru and kk
