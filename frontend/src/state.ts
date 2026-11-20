import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Lang, Match, ProfileIn } from "./types";

export type Route = "find" | "join" | "map" | "qr" | "design";
const ROUTES: Route[] = ["find", "join", "map", "qr", "design"];

/** Tiny hash router: #/map, #/join, ... (works with any static host and the QR link). */
export function useRoute(): [Route, (r: Route) => void] {
  const read = (): Route => {
    const r = window.location.hash.replace(/^#\/?/, "").split("?")[0] as Route;
    return ROUTES.includes(r) ? r : "find";
  };
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return [route, (r) => (window.location.hash = r === "find" ? "/" : `/${r}`)];
}

export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export function initialLang(): Lang {
  const v = storageGet("lang");
  if (v === "kk" || v === "ru" || v === "en") return v;
  const nav = navigator.language.slice(0, 2);
  return nav === "kk" || nav === "en" ? nav : "ru";
}

export const EMPTY_PROFILE: ProfileIn = {
  name: "",
  role: "",
  stack: [],
  experience_years: 0,
  interests: [],
  about: "",
  goal: "find_job",
  lang: "ru",
};

/**
 * Matching session: the viewer's form, their matches, and their id in the backend.
 * The id comes from POST /api/profiles, made on /join (to appear on the map) or lazily
 * on the first feedback. Passing it as viewer_id hides the viewer from their own results.
 */
export function useMatcher(lang: Lang) {
  const [form, setFormState] = useState<ProfileIn>({ ...EMPTY_PROFILE, lang });
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [tookMs, setTookMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);

  const setForm = useCallback((p: ProfileIn) => {
    setFormState(p);
    setViewerId(null); // profile changed: the stored copy is stale, store a fresh one when needed
  }, []);

  const register = async (profile: ProfileIn) => {
    const { id } = await api.addProfile(profile);
    setViewerId(id);
    return id;
  };

  async function submit(opts: { join: boolean }) {
    setLoading(true);
    setError(false);
    const profile = { ...form, lang };
    try {
      const id = viewerId ?? (opts.join ? await register(profile) : null);
      const res = await api.recommend(profile, lang, id);
      setMatches(res.matches);
      setTookMs(res.took_ms);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function feedback(targetId: string, verdict: "met" | "not_fit") {
    setBusyId(targetId);
    setError(false);
    try {
      const id = viewerId ?? (await register({ ...form, lang }));
      const res = await api.feedback(id, targetId, verdict);
      setMatches(res.matches);
      setTookMs(res.took_ms);
    } catch {
      setError(true);
    } finally {
      setBusyId(null);
    }
  }

  return { form, setForm, matches, tookMs, loading, busyId, error, viewerId, submit, feedback };
}

export type Matcher = ReturnType<typeof useMatcher>;
