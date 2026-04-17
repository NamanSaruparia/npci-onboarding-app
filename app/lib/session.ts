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
  uploadedDocs?: number;
  [key: string]: unknown;
};

export function parseSessionUser(raw: string | null): SessionUser | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as SessionUser;
    return u && typeof u === "object" ? u : null;
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
