/**
 * Calendar days after joining for the first goals draft and the mini-assignment due date
 * (UTC calendar-day roll-forward from the stored joining instant).
 */
export const POST_JOIN_MILESTONE_DAYS_AFTER_JOIN = 21;

/** @deprecated Use POST_JOIN_MILESTONE_DAYS_AFTER_JOIN — kept for imports that reference this name. */
export const GOAL_FIRST_DRAFT_DAYS_AFTER_JOIN = POST_JOIN_MILESTONE_DAYS_AFTER_JOIN;

export function parseJoiningIso(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) {
    if (!Number.isFinite(raw.getTime())) return null;
    return raw.toISOString();
  }
  if (typeof raw === "string") {
    const d = new Date(raw);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toISOString();
  }
  return null;
}

export function goalFirstDraftDueIso(joiningIso: string): Date | null {
  const base = new Date(joiningIso);
  if (!Number.isFinite(base.getTime())) return null;
  const due = new Date(base);
  due.setUTCDate(due.getUTCDate() + POST_JOIN_MILESTONE_DAYS_AFTER_JOIN);
  return due;
}

export function formatLongDate(d: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Whole calendar days from local "today" to the joining calendar day (UTC Y/M/D from stored ISO). */
export function daysUntilJoiningDate(joiningIso: string): number | null {
  const joining = new Date(joiningIso);
  if (!Number.isFinite(joining.getTime())) return null;
  const joinDay = new Date(
    joining.getUTCFullYear(),
    joining.getUTCMonth(),
    joining.getUTCDate()
  );
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((joinDay.getTime() - todayDay.getTime()) / 86400000);
}
