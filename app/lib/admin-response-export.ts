import * as XLSX from "xlsx";

/** Minimal user shape for exports (matches admin API user). */
export type ResponseExportUser = {
  name?: string;
  mobile: string;
  checkInAnswers?: {
    q1: number;
    q2: number;
    q3: number;
    q4: string;
    q5: number;
    q6: number;
    q7: number;
    q8: number;
    q9: string;
    submittedAt?: string;
  } | null;
  feedbackSurvey?: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    q5: string;
    q6: string;
    q7: string;
    submittedAt?: string;
  } | null;
};

const CHECKIN_Q: Record<string, string> = {
  q1: "How has your overall onboarding experience been till now?",
  q2: "Have your initial expectations been met?",
  q3: "How helpful has your buddy been in your onboarding journey?",
  q4: "What has been the most positive part about your journey?",
  q5: "Laptop/Devices readiness on joining",
  q6: "Onboarding Kit readiness on joining",
  q7: "Email and Collaboration tools readiness on joining",
  q8: "Access to internal tools (HRMS/Enable etc) readiness on joining",
  q9: "Were your role expectations and Success metrics clearly defined?",
};

const SURVEY_Q: Record<string, string> = {
  q1: "How would you rate your overall onboarding experience at NPCI?",
  q2: "How easy was it to use the onboarding platform?",
  q3: "How comfortable do you feel in your role after the first 30 days?",
  q4: "How welcomed and supported did you feel during your first 30 days?",
  q5: "What aspects of the onboarding experience stood out positively?",
  q6: "What improvements would you recommend for enhancing the onboarding experience?",
  q7: "How well did you integrate into the leadership ecosystem?",
};

const RATING: Record<number, string> = {
  1: "Very Poor",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

function fmtRating(n: number): string {
  if (!n || n < 1 || n > 5) return "";
  const label = RATING[n] ?? "";
  return label ? `${n} — ${label}` : String(n);
}

function fmtSubmitted(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString();
}

const CHECKIN_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"] as const;
const SURVEY_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;

export function getCheckInTable(users: ResponseExportUser[]): {
  headers: string[];
  rows: string[][];
} {
  const headers = [
    "Name",
    "Mobile",
    "Submitted at",
    ...CHECKIN_KEYS.map((k) => CHECKIN_Q[k]),
  ];
  const rows = users.map((u) => {
    const c = u.checkInAnswers;
    const has = Boolean(c?.submittedAt);
    const cells: string[] = [
      (u.name || "").trim() || "—",
      u.mobile,
      has ? fmtSubmitted(c!.submittedAt) : "",
    ];
    for (const k of CHECKIN_KEYS) {
      if (!has || !c) {
        cells.push("");
        continue;
      }
      if (k === "q4" || k === "q9") {
        cells.push(String(c[k] ?? "").trim());
      } else {
        const n = Number(c[k as keyof typeof c]);
        cells.push(Number.isFinite(n) && n > 0 ? fmtRating(n) : "");
      }
    }
    return cells;
  });
  return { headers, rows };
}

export function getFeedbackSurveyTable(users: ResponseExportUser[]): {
  headers: string[];
  rows: string[][];
} {
  const headers = [
    "Name",
    "Mobile",
    "Submitted at",
    ...SURVEY_KEYS.map((k) => SURVEY_Q[k]),
  ];
  const rows = users.map((u) => {
    const s = u.feedbackSurvey;
    const has = Boolean(s?.submittedAt);
    const cells: string[] = [
      (u.name || "").trim() || "—",
      u.mobile,
      has ? fmtSubmitted(s!.submittedAt) : "",
    ];
    for (const k of SURVEY_KEYS) {
      if (!has || !s) {
        cells.push("");
        continue;
      }
      if (k === "q5" || k === "q6" || k === "q7") {
        cells.push(String(s[k] ?? "").trim());
      } else {
        const n = Number(s[k as keyof typeof s]);
        cells.push(Number.isFinite(n) && n > 0 ? fmtRating(n) : "");
      }
    }
    return cells;
  });
  return { headers, rows };
}

function sheetFromTable(headers: string[], rows: string[][]) {
  const aoa = [headers, ...rows];
  return XLSX.utils.aoa_to_sheet(aoa);
}

export function downloadResponsesWorkbook(users: ResponseExportUser[]): void {
  const wb = XLSX.utils.book_new();
  const checkIn = getCheckInTable(users);
  const survey = getFeedbackSurveyTable(users);
  XLSX.utils.book_append_sheet(wb, sheetFromTable(checkIn.headers, checkIn.rows), "Mid journey check-in");
  XLSX.utils.book_append_sheet(wb, sheetFromTable(survey.headers, survey.rows), "Onboarding feedback");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `npci-onboarding-responses-${stamp}.xlsx`);
}
