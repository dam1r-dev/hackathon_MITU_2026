/** The member session from joining an event (contract: keep the token in localStorage). */
export type MemberSession = { token: string; memberId: string; lastEvent?: string };

const KEY = "member";

function read(): MemberSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v.token === "string" && typeof v.memberId === "string" ? v : null;
  } catch {
    return null;
  }
}

// In-memory copy so the app still works when storage is blocked (private mode).
let current: MemberSession | null = read();

export const session = {
  get: () => current,
  set(s: MemberSession) {
    current = s;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* storage unavailable: keep in memory */
    }
  },
  clear() {
    current = null;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};

/** "Want to meet" requests I sent, per event. The API only reports mutual ones. */
export const sentMeets = {
  get(code: string): string[] {
    try {
      const v = JSON.parse(localStorage.getItem(`meets:${code}`) ?? "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  },
  add(code: string, id: string) {
    const next = [...new Set([...sentMeets.get(code), id])];
    try {
      localStorage.setItem(`meets:${code}`, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    return next;
  },
};

/** Admin token from POST /api/admin/login. The backend keeps it in memory: sign in again after a restart. */
export const adminSession = {
  get(): string | null {
    try {
      return localStorage.getItem("adminToken");
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem("adminToken", token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem("adminToken");
    } catch {
      /* ignore */
    }
  },
};
