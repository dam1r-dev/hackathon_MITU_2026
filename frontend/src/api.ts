import type { GraphResponse, Lang, Profile, ProfileIn, RecommendResponse } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  /** viewer_id (from addProfile) hides the viewer from their own results and applies their feedback. */
  recommend: (profile: ProfileIn, lang: Lang, viewer_id?: string | null) =>
    post("/api/recommend", { profile, lang, ...(viewer_id ? { viewer_id } : {}) }).then((r) => json<RecommendResponse>(r)),

  addProfile: (profile: ProfileIn) => post("/api/profiles", profile).then((r) => json<{ id: string }>(r)),

  profiles: () => fetch("/api/profiles").then((r) => json<Profile[]>(r)),

  graph: (viewer?: string) =>
    fetch(`/api/graph${viewer ? `?viewer=${encodeURIComponent(viewer)}` : ""}`).then((r) => json<GraphResponse>(r)),

  feedback: (viewer_id: string, target_id: string, verdict: "met" | "not_fit") =>
    post("/api/feedback", { viewer_id, target_id, verdict }).then((r) => json<RecommendResponse>(r)),
};
