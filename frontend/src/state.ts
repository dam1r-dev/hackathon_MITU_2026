import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Lang, Match, ProfileIn } from "./types";

/**
 * Hash routes (work on any static host and inside the QR link):
 *   #/              find (quick demo, no event)
 *   #/join          quick demo that also stores the profile
 *   #/join/<code>   event landing + onboarding (the QR target)
 *   #/e/<code>      my top 5 inside an event
 *   #/screen/<code> projector: big QR, live counter, room map   (#/qr = last event or DEMO)
 *   #/me            my profile
 *   #/map, #/design
 */
export type RouteName = "find" | "join" | "event-join" | "event" | "screen" | "me" | "map" | "design";
export type Route = { name: RouteName; code?: string };

function parse(): Route {
  const [head = "", arg] = window.location.hash.replace(/^#\/?/, "").split("?")[0].split("/");
  const code = arg ? decodeURIComponent(arg).toUpperCase() : undefined;
  switch (head) {
    case "join":
      return code ? { name: "event-join", code } : { name: "join" };
    case "e":
      return code ? { name: "event", code } : { name: "me" };
    case "screen":
    case "qr":
      return { name: "screen", code: code ?? storageGet("lastEvent") ?? "DEMO" };
    case "me":
    case "map":
    case "design":
      return { name: head };
    default:
      return { name: "find" };
  }
}

export const href = (r: Route): string => {
  switch (r.name) {
    case "find":
      return "#/";
    case "event-join":
      return `#/join/${r.code}`;
    case "event":
      return `#/e/${r.code}`;
    case "screen":
      return `#/screen/${r.code ?? ""}`;
    default:
      return `#/${r.name}`;
  }
};

/** Backend join links may be path style (/join/CODE); move them into the hash router. */
function normalizePath() {
  const m = window.location.pathname.match(/^\/join\/([^/]+)\/?$/);
  if (m) window.history.replaceState(null, "", `/#/join/${m[1]}`);
}

export function useRoute(): [Route, (r: Route) => void] {
  normalizePath();
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return [route, (r) => (window.location.hash = href(r).slice(1))];
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

export type Theme = "system" | "light" | "dark";

/** Appearance: "system" follows the OS; light/dark force data-theme on <html> (see tokens.css). */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const v = storageGet("theme");
    return v === "light" || v === "dark" ? v : "system";
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    storageSet("theme", theme);
    // Browser UI color (address bar on phones) follows the page background.
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", bg));
  }, [theme]);
  return [theme, setTheme];
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
