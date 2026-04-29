/**
 * Client session stored under localStorage key "user".
 * Index signature allows admin/API fields without schema churn.
 */
export type SessionUser = {
  mobile?: string;
  name?: string;
  role?: string;
  position?: string;
  location?: string;
  profileImageUrl?: string;
  isAllowed?: boolean;
  isVerified?: boolean;
  isAdmin?: boolean;
  uploadedDocs?: number;
  [key: string]: unknown;
};

function normalizeDisplayName(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (/^anu\s+rama\s*k\s*rishnan$/i.test(cleaned)) return "Anu Ramakrishnan";
  return name;
}

export function normalizeSessionUser(u: SessionUser): SessionUser {
  const next = { ...u };
  if (typeof next.name === "string" && next.name.trim()) {
    next.name = normalizeDisplayName(next.name);
  }
  return next;
}

export function parseSessionUser(raw: string | null): SessionUser | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as SessionUser;
    if (!u || typeof u !== "object") return null;
    return normalizeSessionUser(u);
  } catch {
    return null;
  }
}

/** Valid onboarding session requires a persisted mobile (set at OTP login). */
export function hasValidSessionUser(): boolean {
  if (typeof window === "undefined") return false;
  const u = parseSessionUser(localStorage.getItem("user"));
  return Boolean(u?.mobile);
}

/**
 * Returns the correct post-login destination based on the stored session.
 * Admins go to /admin; everyone else goes to /dashboard.
 */
export function sessionDestination(): "/admin" | "/dashboard" {
  if (typeof window === "undefined") return "/dashboard";
  const u = parseSessionUser(localStorage.getItem("user"));
  return u?.isAdmin ? "/admin" : "/dashboard";
}
