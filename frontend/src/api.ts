import type { GraphResponse, Lang, ProfileIn, RecommendResponse } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  recommend: (profile: ProfileIn, lang: Lang) =>
    fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, lang }),
    }).then((r) => json<RecommendResponse>(r)),

  addProfile: (profile: ProfileIn) =>
    fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).then((r) => json<{ id: string }>(r)),

  graph: (viewer?: string) =>
    fetch(`/api/graph${viewer ? `?viewer=${viewer}` : ""}`).then((r) => json<GraphResponse>(r)),

  feedback: (viewer_id: string, target_id: string, verdict: "met" | "not_fit") =>
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewer_id, target_id, verdict }),
    }).then((r) => json<RecommendResponse>(r)),
};
