"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";
import {
  downloadResponsesWorkbook,
  getCheckInTable,
  getFeedbackSurveyTable,
} from "@/app/lib/admin-response-export";

type AdminUser = {
  _id?: string;
  id?: string;
  name?: string;
  mobile: string;
  position?: string;
  reportingManager?: string;
  location?: string;
  employeeType?: "fresher" | "lateral";
  entity?: "NPCI" | "NBBL" | "NIPL" | "NBSL";
  band?: "B1" | "B2";
  profileImageUrl?: string;
  isAllowed: boolean;
  isVerified: boolean;
  isAdmin?: boolean;
  uploadedDocs: number;
  documents?: {
    docId?: string;
    fileId?: string;
    name: string;
    fileUrl?: string;
    status: "pending" | "approved" | "rejected";
    uploadedAt?: string;
  }[];
  buddyAnswers?: { questionId: string; answer: string }[];
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
  onboardingKit?: string[];
  onboardingKitDetails?: {
    selectedCardVariant?: string;
    bankName?: string;
  } | null;
  miniAssignmentConfig?: {
    assignmentId?: string;
    title?: string;
    priority?: "Low" | "Medium" | "High";
    context?: string;
    dueOnISO?: string;
    questions?: { id: string; label: string; placeholder: string; rows: number }[];
    updatedAt?: string;
  } | null;
  miniAssignmentSubmission?: {
    assignmentId?: string;
    answers?: { questionId: string; answer: string }[];
    attachmentFileId?: string;
    attachmentFileName?: string;
    submittedAt?: string;
  } | null;
  /** ISO date string from Mongo (admin-set). */
  dayOfJoining?: string | null;
};

const CHECKIN_SCALE: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😞", label: "Very Poor" },
  2: { emoji: "😕", label: "Poor" },
  3: { emoji: "😐", label: "Average" },
  4: { emoji: "🙂", label: "Good" },
  5: { emoji: "😄", label: "Excellent" },
};

const CHECKIN_QUESTIONS: Record<string, string> = {
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

const KIT_ITEMS: { name: string; icon: string }[] = [
  { name: "Coffee Mug", icon: "☕" },
  { name: "Water Bottle", icon: "🧴" },
  { name: "Customized Diary & Pen", icon: "📓" },
  { name: "Leadership Book", icon: "📘" },
  { name: "Backpack", icon: "🎒" },
  { name: "Bluetooth Speaker", icon: "🔊" },
];

const KIT_ICON: Record<string, string> = Object.fromEntries(
  KIT_ITEMS.map((i) => [i.name, i.icon])
);

const SURVEY_SCALE: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😞", label: "Very Poor" },
  2: { emoji: "😕", label: "Poor" },
  3: { emoji: "😐", label: "Average" },
  4: { emoji: "🙂", label: "Good" },
  5: { emoji: "😄", label: "Excellent" },
};

const SURVEY_QUESTIONS: Record<string, string> = {
  q1: "How would you rate your overall onboarding experience at NPCI?",
  q2: "How easy was it to use the onboarding platform?",
  q3: "How comfortable do you feel in your role after the first 30 days?",
  q4: "How welcomed and supported did you feel during your first 30 days?",
  q5: "What aspects of the onboarding experience stood out positively?",
  q6: "What improvements would you recommend for enhancing the onboarding experience?",
  q7: "How well did you integrate into the leadership ecosystem?",
};

const BUDDY_QUESTIONS: Record<string, string> = {
  passion_work: "What are you most passionate about in life and work?",
  colleagues_three_words:
    "If your friends or colleagues had to describe you in three words, what would they say?",
  skills_growth:
    "What are some skills you're excited to learn or improve going forward?",
  buddy_support: "How can your buddy best support you during onboarding?",
};

const BUDDY_EMOJIS: Record<string, string> = {
  passion_work: "🔥",
  colleagues_three_words: "💬",
  skills_growth: "📈",
  buddy_support: "🌟",
};

function normalizeMobile(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

function makeQuestionId(label: string) {
  const base = String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 28);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}_${suffix}` : `q_${suffix}`;
}

function toIsoDateInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromIsoDateInput(v: string) {
  if (!v) return "";
  const d = new Date(`${v}T00:00:00.000Z`);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toISOString();
}

export default function AdminPage() {
  const router = useRouter();
  const { ready: sessionReady, sessionUser } = useRequireSession();

  const locations = ["Hyderabad", "Mumbai", "Chennai"] as const;
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [position, setPosition] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [location, setLocation] = useState<(typeof locations)[number]>("Hyderabad");
  const [employeeType, setEmployeeType] = useState<"" | "fresher" | "lateral">("");
  const [entity, setEntity] = useState<"" | "NPCI" | "NBBL" | "NIPL" | "NBSL">("");
  const [band, setBand] = useState<"" | "B1" | "B2">("");
  const [dayOfJoiningInput, setDayOfJoiningInput] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [busyMobile, setBusyMobile] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<"buddy" | "checkin" | "kit" | "survey" | "mini">("buddy");

  const [exportPreview, setExportPreview] = useState<"checkin" | "survey" | null>(null);

  const [miniEdit, setMiniEdit] = useState<{
    mobile: string;
    assignmentId: string;
    title: string;
    priority: "Low" | "Medium" | "High";
    dueOnISO: string;
    context: string;
    questions: { id: string; label: string; placeholder: string; rows: number }[];
  } | null>(null);

  const totalUsers = useMemo(() => users.length, [users.length]);

  const checkInExportTable = useMemo(() => getCheckInTable(users), [users]);
  const surveyExportTable = useMemo(() => getFeedbackSurveyTable(users), [users]);

  // Redirect non-admin sessions away from this page
  useEffect(() => {
    if (!sessionReady) return;
    if (!sessionUser?.isAdmin) {
      router.replace("/dashboard");
    }
  }, [sessionReady, sessionUser, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/get-users", { method: "GET" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Unable to fetch users.");
        return;
      }
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch {
      toast.error("Network error while loading users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionReady || !sessionUser?.isAdmin) return;
    void fetchUsers();
  }, [sessionReady, sessionUser]);

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeMobile(mobile);
    if (!/^\d{10}$/.test(normalized)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!editingUser && !name.trim()) {
      toast.error("Enter user name.");
      return;
    }
    if (!editingUser && !position.trim()) {
      toast.error("Enter position.");
      return;
    }
    if (!editingUser && !reportingManager.trim()) {
      toast.error("Enter reporting manager.");
      return;
    }
    if (!employeeType) {
      toast.error("Select employee type.");
      return;
    }
    if (!entity) {
      toast.error("Select entity.");
      return;
    }
    if (!band) {
      toast.error("Select band level.");
      return;
    }

    let profileImageUrl = "";
    if (profileImageFile) {
      profileImageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(profileImageFile);
      }).catch(() => {
        toast.error("Failed to read profile image.");
        return "";
      });
    }

    setSubmitting(true);
    try {
      const url = editingUser ? "/api/admin/update-user" : "/api/admin/add-user";
      const dojIso = fromIsoDateInput(dayOfJoiningInput);
      const payload = editingUser
        ? {
            mobile: normalized,
            name: name.trim() || editingUser.name,
            position: position.trim() || editingUser.position,
            location: location || editingUser.location,
            reportingManager: reportingManager.trim() || editingUser.reportingManager,
            employeeType,
            entity,
            band,
            dayOfJoining: dojIso || null,
          }
        : {
            name: name.trim(),
            mobile: normalized,
            position: position.trim(),
            reportingManager: reportingManager.trim(),
            location,
            employeeType,
            entity,
            band,
            profileImageUrl,
            ...(dojIso ? { dayOfJoining: dojIso } : {}),
          };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || (editingUser ? "Unable to update user." : "Unable to add user."));
        return;
      }

      setName("");
      setMobile("");
      setPosition("");
      setReportingManager("");
      setLocation("Hyderabad");
      setEmployeeType("");
      setEntity("");
      setBand("");
      setDayOfJoiningInput("");
      setProfileImageFile(null);
      const savedUser = data?.user as AdminUser | undefined;
      if (savedUser) {
        if (editingUser) {
          setUsers((prev) =>
            prev.map((u) => (u.mobile === savedUser.mobile ? { ...u, ...savedUser } : u))
          );
        } else {
          setUsers((prev) => [savedUser, ...prev]);
        }
      }
      setEditingUser(null);
      toast.success(editingUser ? "User updated successfully." : "User added and allowed for onboarding.");
    } catch {
      toast.error("Network error while adding user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setName(user.name || "");
    setMobile(user.mobile || "");
    setPosition(user.position || "");
    setReportingManager(user.reportingManager || "");
    setLocation(
      (user.location as (typeof locations)[number]) || "Hyderabad"
    );
    setEmployeeType(user.employeeType || "fresher");
    setEntity(user.entity || "NPCI");
    setBand(user.band || "B1");
    setDayOfJoiningInput(toIsoDateInput(user.dayOfJoining ?? undefined));
  };

  const handleToggle = async (targetMobile: string) => {
    setBusyMobile(targetMobile);
    try {
      const res = await fetch("/api/admin/toggle-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: targetMobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Unable to update access.");
        return;
      }
      const updatedUser = data?.user as AdminUser | undefined;
      if (updatedUser) {
        setUsers((prev) =>
          prev.map((u) => (u.mobile === updatedUser.mobile ? { ...u, ...updatedUser } : u))
        );
      }
      toast.success(data?.user?.isAllowed ? "User allowed." : "User blocked.");
    } catch {
      toast.error("Network error while toggling access.");
    } finally {
      setBusyMobile(null);
    }
  };

  const handleDelete = async (targetMobile: string) => {
    setBusyMobile(targetMobile);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: targetMobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Unable to delete user.");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.mobile !== targetMobile));
      toast.success("User deleted.");
    } catch {
      toast.error("Network error while deleting user.");
    } finally {
      setBusyMobile(null);
    }
  };

  const openMiniAssignment = (user: AdminUser) => {
    const cfg = user.miniAssignmentConfig;
    setMiniEdit({
      mobile: user.mobile,
      assignmentId: String(cfg?.assignmentId || "mini-assignment-001"),
      title: String(cfg?.title || "Leadership Entry: 30–60–90 Day Executive Brief"),
      priority: (cfg?.priority === "Low" || cfg?.priority === "Medium" || cfg?.priority === "High")
        ? cfg.priority
        : "High",
      dueOnISO: String(cfg?.dueOnISO || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()),
      context: String(cfg?.context || ""),
      questions: Array.isArray(cfg?.questions) && cfg!.questions!.length > 0
        ? cfg!.questions!.map((q) => ({
            id: String(q.id || ""),
            label: String(q.label || ""),
            placeholder: String(q.placeholder || ""),
            rows: Number(q.rows || 4),
          }))
        : [
            { id: "executiveSummary", label: "Executive summary", placeholder: "2–4 bullets: outcomes, guiding principles, and what you’ll optimize for.", rows: 4 },
            { id: "priorities30", label: "30 days", placeholder: "Priorities, quick wins, discovery plan…", rows: 6 },
            { id: "priorities60", label: "60 days", placeholder: "Build capability, align stakeholders, ship milestones…", rows: 6 },
            { id: "priorities90", label: "90 days", placeholder: "Scaled execution, measurable outcomes, operating rhythm…", rows: 6 },
            { id: "stakeholders", label: "Stakeholders & cadence", placeholder: "Who matters most, how you’ll engage, and what you need from them.", rows: 4 },
            { id: "risksAndDependencies", label: "Risks & dependencies", placeholder: "Known unknowns, constraints, mitigations, key dependencies.", rows: 5 },
            { id: "supportNeeded", label: "Support needed", placeholder: "Decisions, access, resources, introductions, context you need.", rows: 5 },
          ],
    });
  };

  const saveMiniAssignment = async () => {
    if (!miniEdit) return;
    if (!miniEdit.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!miniEdit.assignmentId.trim()) {
      toast.error("Assignment ID is required.");
      return;
    }
    const questions = miniEdit.questions
      .map((q) => ({
        id: String(q.id || "").trim(),
        label: String(q.label || "").trim(),
        placeholder: String(q.placeholder || "").trim(),
        rows: Math.max(2, Math.min(18, Number(q.rows || 4))),
      }))
      .filter((q) => q.id && q.label);

    if (questions.length === 0) {
      toast.error("Add at least one question.");
      return;
    }

    setBusyMobile(miniEdit.mobile);
    try {
      const res = await fetch("/api/admin/update-mini-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: miniEdit.mobile,
          config: {
            assignmentId: miniEdit.assignmentId,
            title: miniEdit.title,
            priority: miniEdit.priority,
            context: miniEdit.context,
            dueOnISO: miniEdit.dueOnISO,
            questions,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.message || "Unable to save mini assignment.");
        return;
      }
      if (data?.config && miniEdit) {
        const targetMobile = miniEdit.mobile;
        setUsers((prev) =>
          prev.map((u) =>
            u.mobile === targetMobile ? { ...u, miniAssignmentConfig: data.config } : u
          )
        );
      }
      setMiniEdit(null);
      toast.success("Mini assignment updated.");
    } catch {
      toast.error("Network error while saving mini assignment.");
    } finally {
      setBusyMobile(null);
    }
  };

  if (!sessionReady || !sessionUser) return <SessionLoading />;
  if (!sessionUser.isAdmin) return <SessionLoading />;

  const fieldBase =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15";
  const fieldSelect = `${fieldBase} cursor-pointer`;
  const actionBtn =
    "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-900";
  const actionBtnDanger =
    "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-900";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
        <header className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500"
          />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600/90">
                Administration
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Onboarding control center
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Provision employees, manage access, and review onboarding activity in one place.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-5 py-3 text-right shadow-inner">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Directory size
                </p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">
                  {totalUsers}
                </p>
                <p className="text-xs text-slate-500">registered users</p>
              </div>
            </div>
          </div>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Mid journey &amp; survey responses
            </h2>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setExportPreview("checkin")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                Preview check-in
              </button>
              <button
                type="button"
                onClick={() => setExportPreview("survey")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                Preview survey
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!users.length) {
                    toast.error("Load users first.");
                    return;
                  }
                  try {
                    downloadResponsesWorkbook(users);
                    toast.success("Excel workbook downloaded.");
                  } catch {
                    toast.error("Could not build the Excel file.");
                  }
                }}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-emerald-500 hover:to-teal-500"
              >
                Download Excel
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex flex-col gap-1 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {editingUser ? "Edit user" : "Add user"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Required fields marked implicitly — mobile must be 10 digits. Date of joining drives employee timelines.
              </p>
            </div>
            {editingUser ? (
              <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800 ring-1 ring-indigo-100">
                Editing {editingUser.name || editingUser.mobile}
              </span>
            ) : null}
          </div>
          <form
            onSubmit={handleAddUser}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldBase}
            />
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Mobile (10 digits)"
              value={mobile}
              onChange={(e) => setMobile(normalizeMobile(e.target.value))}
              readOnly={Boolean(editingUser)}
              className={`${fieldBase} ${editingUser ? "cursor-not-allowed bg-slate-50 text-slate-600" : ""}`}
            />
            <input
              type="text"
              placeholder="Position / title"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={fieldBase}
            />
            <input
              type="text"
              placeholder="Reporting manager"
              value={reportingManager}
              onChange={(e) => setReportingManager(e.target.value)}
              className={fieldBase}
            />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as (typeof locations)[number])}
              className={fieldSelect}
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <select
              value={employeeType}
              onChange={(e) =>
                setEmployeeType(e.target.value as "" | "fresher" | "lateral")
              }
              className={`${fieldSelect} ${employeeType ? "text-slate-900" : "text-slate-400"}`}
            >
              <option value="">Employee type</option>
              <option value="fresher">Fresher</option>
              <option value="lateral">Lateral</option>
            </select>
            <select
              value={entity}
              onChange={(e) =>
                setEntity(e.target.value as "" | "NPCI" | "NBBL" | "NIPL" | "NBSL")
              }
              className={`${fieldSelect} ${entity ? "text-slate-900" : "text-slate-400"}`}
            >
              <option value="">Entity</option>
              <option value="NPCI">NPCI</option>
              <option value="NBBL">NBBL</option>
              <option value="NIPL">NIPL</option>
              <option value="NBSL">NBSL</option>
            </select>
            <select
              value={band}
              onChange={(e) => setBand(e.target.value as "" | "B1" | "B2")}
              className={`${fieldSelect} ${band ? "text-slate-900" : "text-slate-400"}`}
            >
              <option value="">Band level</option>
              <option value="B1">B1 &amp; Below</option>
              <option value="B2">B2 &amp; Above</option>
            </select>
            <label className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Date of joining
              </span>
              <input
                type="date"
                value={dayOfJoiningInput}
                onChange={(e) => setDayOfJoiningInput(e.target.value)}
                className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none"
                title="Used for Day 1 countdown; goal draft and mini-assignment due 21 calendar days after join"
              />
            </label>
            <label className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/40">
              <span className="min-w-0 truncate font-medium text-slate-700">
                {profileImageFile ? profileImageFile.name : "Profile photo (optional)"}
              </span>
              <span className="shrink-0 text-lg opacity-80" aria-hidden>
                🖼️
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-900/10 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {submitting ? (editingUser ? "Updating…" : "Adding…") : (editingUser ? "Save changes" : "Add user")}
            </button>
            {editingUser ? (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setName("");
                  setMobile("");
                  setPosition("");
                  setReportingManager("");
                  setLocation("Hyderabad");
                  setEmployeeType("");
                  setEntity("");
                  setBand("");
                  setDayOfJoiningInput("");
                  setProfileImageFile(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cancel edit
              </button>
            ) : null}
          </form>
        </motion.section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30 px-6 py-5 sm:px-8">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">User directory</h2>
            <p className="mt-1 text-sm text-slate-600">
              Search and manage onboarding records. Expand a row for profile, check-in, kit, and assignments.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/95 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5 sm:px-6">Employee</th>
                  <th className="px-5 py-3.5 sm:px-6">Mobile</th>
                  <th className="px-5 py-3.5 sm:px-6">Role</th>
                  <th className="px-5 py-3.5 sm:px-6">Site</th>
                  <th className="px-5 py-3.5 sm:px-6">Access</th>
                  <th className="px-5 py-3.5 sm:px-6">OTP</th>
                  <th className="px-5 py-3.5 sm:px-6">Docs</th>
                  <th className="px-5 py-3.5 text-right sm:px-6">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center sm:px-6"
                    >
                      <p className="text-sm font-medium text-slate-600">Loading directory…</p>
                      <p className="mt-1 text-xs text-slate-400">Please wait</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center sm:px-6"
                    >
                      <p className="text-sm font-medium text-slate-600">No users yet</p>
                      <p className="mt-1 text-xs text-slate-400">Add a user with the form above to get started.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const rowBusy = busyMobile === user.mobile;
                    const isExpanded = expandedMobile === user.mobile;
                    return (
                      <Fragment key={user.mobile}>
                        <tr
                          className={[
                            "transition-colors",
                            isExpanded
                              ? "bg-indigo-50/50"
                              : "hover:bg-slate-50/80",
                          ].join(" ")}
                        >
                          <td className="px-5 py-3.5 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div
                                aria-hidden
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-slate-100 text-xs font-bold text-indigo-700 ring-2 ring-white shadow-sm"
                              >
                                {(user.name || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {user.name || "Unnamed"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs font-medium tracking-wide text-slate-800 sm:px-6">
                            {user.mobile}
                          </td>
                          <td className="max-w-[10rem] px-5 py-3.5 sm:px-6">
                            <span className="line-clamp-2 text-xs leading-snug text-slate-700">
                              {user.position || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 sm:px-6">
                            <span className="text-xs font-medium text-slate-700">
                              {user.location || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 sm:px-6">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                                user.isAllowed
                                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
                                  : "bg-rose-50 text-rose-800 ring-rose-200/80"
                              }`}
                            >
                              {user.isAllowed ? "Allowed" : "Blocked"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 sm:px-6">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                                user.isVerified
                                  ? "bg-sky-50 text-sky-900 ring-sky-200/80"
                                  : "bg-slate-100 text-slate-600 ring-slate-200/80"
                              }`}
                            >
                              {user.isVerified ? "Verified" : "Pending"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 sm:px-6">
                            <span className="tabular-nums text-sm font-semibold text-slate-800">
                              {user.uploadedDocs}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right sm:px-6">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditUser(user)}
                                className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded && expandedTab === "buddy") {
                                    setExpandedMobile(null);
                                  } else {
                                    setExpandedMobile(user.mobile);
                                    setExpandedTab("buddy");
                                  }
                                }}
                                className={actionBtn}
                              >
                                {isExpanded && expandedTab === "buddy" ? "Hide profile" : "Profile"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded && expandedTab === "checkin") {
                                    setExpandedMobile(null);
                                  } else {
                                    setExpandedMobile(user.mobile);
                                    setExpandedTab("checkin");
                                  }
                                }}
                                className={actionBtn}
                              >
                                {isExpanded && expandedTab === "checkin" ? "Hide check-in" : "Check-in"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded && expandedTab === "kit") {
                                    setExpandedMobile(null);
                                  } else {
                                    setExpandedMobile(user.mobile);
                                    setExpandedTab("kit");
                                  }
                                }}
                                className={actionBtn}
                              >
                                {isExpanded && expandedTab === "kit" ? "Hide kit" : "Kit"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded && expandedTab === "survey") {
                                    setExpandedMobile(null);
                                  } else {
                                    setExpandedMobile(user.mobile);
                                    setExpandedTab("survey");
                                  }
                                }}
                                className={actionBtn}
                              >
                                {isExpanded && expandedTab === "survey" ? "Hide survey" : "Survey"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  openMiniAssignment(user);
                                  if (isExpanded && expandedTab === "mini") {
                                    setExpandedMobile(null);
                                  } else {
                                    setExpandedMobile(user.mobile);
                                    setExpandedTab("mini");
                                  }
                                }}
                                className={actionBtn}
                              >
                                {isExpanded && expandedTab === "mini" ? "Hide mini" : "Mini task"}
                              </button>
                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() => void handleToggle(user.mobile)}
                                className={`${actionBtn} disabled:opacity-50`}
                              >
                                {user.isAllowed ? "Block" : "Allow"}
                              </button>
                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() => void handleDelete(user.mobile)}
                                className={`${actionBtnDanger} disabled:opacity-50`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr className="border-t border-indigo-100 bg-gradient-to-br from-slate-50/95 via-white to-indigo-50/30">
                            <td colSpan={8} className="px-5 py-6 sm:px-8">
                              {expandedTab === "buddy" ? (
                                <div>
                                  <div className="mb-3 flex items-center gap-2">
                                    <span className="text-base">🌱</span>
                                    <p className="text-xs font-semibold text-violet-900">
                                      Candidate Profile — {user.name || user.mobile}
                                    </p>
                                  </div>
                                  {!user.buddyAnswers || user.buddyAnswers.length === 0 ? (
                                    <p className="text-xs text-muted">
                                      This user hasn&apos;t submitted their buddy answers yet.
                                    </p>
                                  ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {user.buddyAnswers.filter((a) => a.answer?.trim()).map((a) => (
                                        <div
                                          key={a.questionId}
                                          className="rounded-xl border border-violet-200/90 bg-violet-50/80 p-3"
                                        >
                                          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-900">
                                            <span>{BUDDY_EMOJIS[a.questionId] ?? "💡"}</span>
                                            {BUDDY_QUESTIONS[a.questionId] ?? a.questionId}
                                          </p>
                                          <p className="text-xs leading-relaxed text-foreground/85">
                                            {a.answer}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : expandedTab === "kit" ? (
                                /* ── Onboarding Kit tab ───────────────────── */
                                <div>
                                  <div className="mb-3 flex items-center gap-2">
                                    <span className="text-base">🎁</span>
                                    <p className="text-xs font-semibold text-amber-900">
                                      Onboarding Kit — {user.name || user.mobile}
                                    </p>
                                  </div>

                                  {!user.onboardingKit || user.onboardingKit.length === 0 ? (
                                    <p className="text-xs text-muted">
                                      This user hasn&apos;t selected their onboarding kit yet.
                                    </p>
                                  ) : (
                                    <>
                                      <p className="mb-3 text-[11px] text-muted">
                                        {user.onboardingKit.length} item{user.onboardingKit.length !== 1 ? "s" : ""} selected
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {KIT_ITEMS.map((item) => {
                                          const chosen = user.onboardingKit!.includes(item.name);
                                          return (
                                            <div
                                              key={item.name}
                                              className={[
                                                "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                                                chosen
                                                  ? "border-amber-300 bg-amber-100 text-amber-900"
                                                  : "border-border/40 bg-background/30 text-muted/50 line-through",
                                              ].join(" ")}
                                            >
                                              <span>{KIT_ICON[item.name] ?? "📦"}</span>
                                              <span>{item.name}</span>
                                              {chosen && <span className="text-[10px] text-amber-400">✓</span>}
                                            </div>
                                          );
                                        })}
                                      </div>
                                      {(user.onboardingKitDetails?.selectedCardVariant ||
                                        user.onboardingKitDetails?.bankName) && (
                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                          <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-3">
                                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-900">
                                              RuPay Card Design
                                            </p>
                                            <p className="text-xs text-foreground/85">
                                              {user.onboardingKitDetails?.selectedCardVariant?.trim()
                                                ? user.onboardingKitDetails.selectedCardVariant
                                                : <span className="italic text-muted">No design selected</span>}
                                            </p>
                                          </div>
                                          <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-3">
                                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-900">
                                              Bank Name
                                            </p>
                                            <p className="text-xs text-foreground/85">
                                              {user.onboardingKitDetails?.bankName?.trim()
                                                ? user.onboardingKitDetails.bankName
                                                : <span className="italic text-muted">Not provided</span>}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ) : expandedTab === "survey" ? (
                                /* ── Feedback Survey tab ──────────────────── */
                                <div>
                                  <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">📝</span>
                                      <p className="text-xs font-semibold text-violet-900">
                                        Onboarding Feedback Survey — {user.name || user.mobile}
                                      </p>
                                    </div>
                                    {user.feedbackSurvey?.submittedAt && (
                                      <span className="text-[10px] text-muted">
                                        Submitted{" "}
                                        {new Date(user.feedbackSurvey.submittedAt).toLocaleString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    )}
                                  </div>

                                  {!user.feedbackSurvey || user.feedbackSurvey.q1 === 0 ? (
                                    <p className="text-xs text-muted">
                                      This user hasn&apos;t submitted their Feedback Survey yet.
                                    </p>
                                  ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {(["q1", "q2", "q3", "q4"] as const).map((key) => {
                                        const val = user.feedbackSurvey![key] as number;
                                        const scale = SURVEY_SCALE[val];
                                        return (
                                          <div
                                            key={key}
                                            className="rounded-xl border border-violet-200/90 bg-violet-50/80 p-3"
                                          >
                                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-900">
                                              {SURVEY_QUESTIONS[key]}
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <span className="text-2xl">{scale?.emoji ?? "—"}</span>
                                              <div>
                                                <p className="text-xs font-semibold text-foreground/90">
                                                  {scale?.label ?? "—"}
                                                </p>
                                                <p className="text-[10px] text-muted">{val} / 5</p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}

                                      {(["q5", "q6", "q7"] as const).map((key) => (
                                        <div
                                          key={key}
                                          className="rounded-xl border border-violet-200/90 bg-violet-50/80 p-3 sm:col-span-2"
                                        >
                                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-900">
                                            {SURVEY_QUESTIONS[key]}
                                          </p>
                                          <p className="text-xs leading-relaxed text-foreground/85">
                                            {user.feedbackSurvey![key]?.trim()
                                              ? user.feedbackSurvey![key]
                                              : <span className="italic text-muted">No response provided.</span>
                                            }
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : expandedTab === "mini" ? (
                                /* ── Mini Assignment tab ──────────────────── */
                                <div>
                                  <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">📋</span>
                                      <p className="text-xs font-semibold text-indigo-900">
                                        Mini Assignment — {user.name || user.mobile}
                                      </p>
                                    </div>
                                    {user.miniAssignmentSubmission?.submittedAt && (
                                      <span className="text-[10px] text-muted">
                                        Submitted{" "}
                                        {new Date(user.miniAssignmentSubmission.submittedAt).toLocaleString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid gap-3 lg:grid-cols-2">
                                    <div className="rounded-2xl border border-indigo-200/90 bg-indigo-50/80 p-4">
                                      <div className="mb-3 flex items-center justify-between gap-2">
                                        <p className="text-xs font-semibold text-indigo-800">Assignment configuration</p>
                                        <button
                                          type="button"
                                          disabled={busyMobile === user.mobile}
                                          onClick={() => void saveMiniAssignment()}
                                          className="rounded-lg border border-indigo-300 bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-900 transition hover:bg-indigo-200/80 disabled:opacity-60"
                                        >
                                          Save
                                        </button>
                                      </div>

                                      {miniEdit && miniEdit.mobile === user.mobile ? (
                                        <div className="grid gap-2">
                                          <div className="grid gap-2 sm:grid-cols-2">
                                            <input
                                              value={miniEdit.title}
                                              onChange={(e) => setMiniEdit({ ...miniEdit, title: e.target.value })}
                                              placeholder="Assignment title"
                                              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-xs text-foreground outline-none focus:border-indigo-400/40"
                                            />
                                            <select
                                              value={miniEdit.priority}
                                              onChange={(e) =>
                                                setMiniEdit({ ...miniEdit, priority: e.target.value as "Low" | "Medium" | "High" })
                                              }
                                              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-xs text-foreground outline-none focus:border-indigo-400/40"
                                            >
                                              <option value="High">High</option>
                                              <option value="Medium">Medium</option>
                                              <option value="Low">Low</option>
                                            </select>
                                          </div>

                                          <div className="grid gap-2 sm:grid-cols-2">
                                            <input
                                              value={miniEdit.assignmentId}
                                              onChange={(e) => setMiniEdit({ ...miniEdit, assignmentId: e.target.value })}
                                              placeholder="Assignment ID"
                                              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-xs text-foreground outline-none focus:border-indigo-400/40"
                                            />
                                            <input
                                              type="date"
                                              value={toIsoDateInput(miniEdit.dueOnISO)}
                                              onChange={(e) => setMiniEdit({ ...miniEdit, dueOnISO: fromIsoDateInput(e.target.value) })}
                                              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-xs text-foreground outline-none focus:border-indigo-400/40"
                                            />
                                          </div>

                                          <textarea
                                            value={miniEdit.context}
                                            onChange={(e) => setMiniEdit({ ...miniEdit, context: e.target.value })}
                                            placeholder="Context / guidance"
                                            rows={4}
                                            className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-xs text-foreground outline-none focus:border-indigo-400/40"
                                          />

                                          <div className="mt-1 flex items-center justify-between">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-800">
                                              Questions
                                            </p>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const id = makeQuestionId("new_question");
                                                setMiniEdit({
                                                  ...miniEdit,
                                                  questions: [
                                                    ...miniEdit.questions,
                                                    { id, label: "New question", placeholder: "Type here…", rows: 4 },
                                                  ],
                                                });
                                              }}
                                              className="rounded-lg border border-indigo-300 bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-900 transition hover:bg-indigo-200/80"
                                            >
                                              + Add question
                                            </button>
                                          </div>

                                          <div className="grid gap-2">
                                            {miniEdit.questions.map((q, idx) => (
                                              <div key={q.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                  <p className="text-[10px] font-semibold text-muted">
                                                    ID: <span className="font-mono text-foreground/80">{q.id}</span>
                                                  </p>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const next = miniEdit.questions.filter((_, i) => i !== idx);
                                                      setMiniEdit({ ...miniEdit, questions: next });
                                                    }}
                                                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-800 transition hover:bg-rose-100"
                                                  >
                                                    Remove
                                                  </button>
                                                </div>
                                                <div className="grid gap-2 sm:grid-cols-3">
                                                  <input
                                                    value={q.label}
                                                    onChange={(e) => {
                                                      const next = [...miniEdit.questions];
                                                      next[idx] = { ...next[idx], label: e.target.value };
                                                      setMiniEdit({ ...miniEdit, questions: next });
                                                    }}
                                                    placeholder="Label"
                                                    className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs text-foreground outline-none focus:border-indigo-400/40"
                                                  />
                                                  <input
                                                    value={q.placeholder}
                                                    onChange={(e) => {
                                                      const next = [...miniEdit.questions];
                                                      next[idx] = { ...next[idx], placeholder: e.target.value };
                                                      setMiniEdit({ ...miniEdit, questions: next });
                                                    }}
                                                    placeholder="Placeholder"
                                                    className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-xs text-foreground outline-none focus:border-indigo-400/40 sm:col-span-2"
                                                  />
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                  <span className="text-[10px] text-muted">Rows</span>
                                                  <input
                                                    type="number"
                                                    min={2}
                                                    max={18}
                                                    value={q.rows}
                                                    onChange={(e) => {
                                                      const next = [...miniEdit.questions];
                                                      next[idx] = { ...next[idx], rows: Number(e.target.value || 4) };
                                                      setMiniEdit({ ...miniEdit, questions: next });
                                                    }}
                                                    className="w-20 rounded-lg border border-border bg-background/50 px-2 py-1 text-xs text-foreground outline-none focus:border-indigo-400/40"
                                                  />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted">Open this tab again to edit config.</p>
                                      )}
                                    </div>

                                    <div className="rounded-2xl border border-indigo-200/90 bg-indigo-50/80 p-4">
                                      <p className="mb-3 text-xs font-semibold text-indigo-800">Latest submission</p>
                                      {!user.miniAssignmentSubmission || !user.miniAssignmentSubmission.answers || user.miniAssignmentSubmission.answers.length === 0 ? (
                                        <p className="text-xs text-muted">No submission yet.</p>
                                      ) : (
                                        <div className="grid gap-2">
                                          {user.miniAssignmentSubmission.answers
                                            .filter((a) => a.answer?.trim())
                                            .map((a) => (
                                              <div
                                                key={a.questionId}
                                                className="rounded-xl border border-border/60 bg-background/40 p-3"
                                              >
                                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-800">
                                                  {a.questionId}
                                                </p>
                                                <p className="text-xs leading-relaxed text-foreground/85 whitespace-pre-wrap">
                                                  {a.answer}
                                                </p>
                                              </div>
                                            ))}
                                          {user.miniAssignmentSubmission.attachmentFileId && (
                                            <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-800">
                                                Attachment
                                              </p>
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs text-foreground/85">
                                                  {user.miniAssignmentSubmission.attachmentFileName || "Uploaded file"}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    window.open(
                                                      `/api/documents/file/${encodeURIComponent(user.miniAssignmentSubmission!.attachmentFileId!)}`,
                                                      "_blank"
                                                    )
                                                  }
                                                  className="rounded-md border border-border bg-background/60 px-2 py-1 text-[10px] font-semibold text-foreground transition hover:border-primary/50"
                                                >
                                                  👁 Preview
                                                </button>
                                                <a
                                                  href={`/api/documents/file/${encodeURIComponent(user.miniAssignmentSubmission.attachmentFileId)}?download=1`}
                                                  className="rounded-md border border-border bg-background/60 px-2 py-1 text-[10px] font-semibold text-foreground transition hover:border-primary/50"
                                                >
                                                  ⬇ Download
                                                </a>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* ── Check-In tab ─────────────────────────── */
                                <div>
                                  <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">📅</span>
                                      <p className="text-xs font-semibold text-teal-900">
                                        Mid Journey Check-In — {user.name || user.mobile}
                                      </p>
                                    </div>
                                    {user.checkInAnswers?.submittedAt && (
                                      <span className="text-[10px] text-muted">
                                        Submitted{" "}
                                        {new Date(user.checkInAnswers.submittedAt).toLocaleString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    )}
                                  </div>

                                  {!user.checkInAnswers || user.checkInAnswers.q1 === 0 ? (
                                    <p className="text-xs text-muted">
                                      This user hasn&apos;t submitted their Mid Journey Check-In yet.
                                    </p>
                                  ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {(["q1", "q2", "q3", "q5", "q6", "q7", "q8"] as const).map((key) => {
                                        const val = user.checkInAnswers![key] as number;
                                        const scale = CHECKIN_SCALE[val];
                                        return (
                                          <div
                                            key={key}
                                            className="rounded-xl border border-teal-200/90 bg-teal-50/80 p-3"
                                          >
                                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-teal-900">
                                              {CHECKIN_QUESTIONS[key]}
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <span className="text-2xl">{scale?.emoji ?? "—"}</span>
                                              <div>
                                                <p className="text-xs font-semibold text-foreground/90">
                                                  {scale?.label ?? "—"}
                                                </p>
                                                <p className="text-[10px] text-muted">{val} / 5</p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}

                                      <div className="rounded-xl border border-teal-200/90 bg-teal-50/80 p-3 sm:col-span-2">
                                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-teal-900">
                                          {CHECKIN_QUESTIONS.q4}
                                        </p>
                                        <p className="text-xs leading-relaxed text-foreground/85">
                                          {user.checkInAnswers.q4?.trim()
                                            ? user.checkInAnswers.q4
                                            : <span className="italic text-muted">No response provided.</span>
                                          }
                                        </p>
                                      </div>

                                      <div className="rounded-xl border border-teal-200/90 bg-teal-50/80 p-3 sm:col-span-2">
                                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-teal-900">
                                          {CHECKIN_QUESTIONS.q9}
                                        </p>
                                        <p className="text-xs leading-relaxed text-foreground/85">
                                          {user.checkInAnswers.q9?.trim()
                                            ? user.checkInAnswers.q9
                                            : <span className="italic text-muted">No response provided.</span>
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex justify-center pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-900"
          >
            <span aria-hidden>←</span>
            Back to dashboard
          </Link>
        </div>

        {exportPreview ? (
          <div
            className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-preview-title"
          >
            <button
              type="button"
              aria-label="Close preview"
              onClick={() => setExportPreview(null)}
              className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            />
            <div className="relative m-0 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:m-4 sm:max-w-[min(96rem,calc(100vw-2rem))] sm:rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
                <h3
                  id="export-preview-title"
                  className="text-base font-semibold tracking-tight text-slate-900"
                >
                  {exportPreview === "checkin"
                    ? "Mid journey check-in — preview"
                    : "Onboarding feedback survey — preview"}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!users.length) {
                        toast.error("No user data to export.");
                        return;
                      }
                      try {
                        downloadResponsesWorkbook(users);
                        toast.success("Excel workbook downloaded.");
                      } catch {
                        toast.error("Could not build the Excel file.");
                      }
                    }}
                    className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-500"
                  >
                    Download Excel (both sheets)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportPreview(null)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
                <table className="min-w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgb(226_232_240)]">
                    <tr>
                      {(exportPreview === "checkin"
                        ? checkInExportTable.headers
                        : surveyExportTable.headers
                      ).map((h, hi) => (
                        <th
                          key={`${h}-${hi}`}
                          className="whitespace-nowrap border-b border-slate-200 px-2 py-2 font-semibold text-slate-700 sm:px-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {(exportPreview === "checkin"
                      ? checkInExportTable.rows
                      : surveyExportTable.rows
                    ).length === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            (exportPreview === "checkin"
                              ? checkInExportTable.headers
                              : surveyExportTable.headers
                            ).length
                          }
                          className="px-3 py-10 text-center text-sm text-slate-500"
                        >
                          No users in the directory yet, or no data to show.
                        </td>
                      </tr>
                    ) : (
                      (exportPreview === "checkin"
                        ? checkInExportTable.rows
                        : surveyExportTable.rows
                      ).map((row, ri) => (
                        <tr key={ri} className="hover:bg-slate-50/80">
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className="max-w-[14rem] whitespace-pre-wrap break-words px-2 py-2 align-top sm:max-w-xs sm:px-3"
                            >
                              {cell === "" ? "—" : cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
