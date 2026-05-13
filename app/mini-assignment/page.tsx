"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";
import { useNotifications } from "../context/NotificationContext";
import { usePageTimer } from "../hooks/usePageTimer";

type Priority = "Low" | "Medium" | "High";

type Question = {
  id: string;
  label: string;
  placeholder: string;
  rows: number;
};

type MiniAssignmentConfig = {
  assignmentId: string;
  title: string;
  priority: Priority;
  context: string;
  dueOnISO: string;
  questions: Question[];
};

type MiniAssignmentSubmission = {
  assignmentId: string;
  answers: { questionId: string; answer: string }[];
  attachmentFileId?: string;
  attachmentFileName?: string;
  submittedAt?: string;
};

type SubmissionDraftV3 = {
  version: 3;
  assignmentId: string;
  answers: Record<string, string>;
  attachmentFileId?: string;
  attachmentFileUrl?: string;
  attachmentFileName?: string;
  lastSavedAtISO?: string;
  submittedAtISO?: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function daysFromNow(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.ceil((t - now) / (1000 * 60 * 60 * 24));
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function countWords(text: string) {
  const t = String(text || "").trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function sectionTone(filled: boolean) {
  return filled ? "border-emerald-200/70 bg-emerald-50/30" : "border-slate-200 bg-white";
}

function defaultConfig(): MiniAssignmentConfig {
  return {
    assignmentId: "mini-assignment-001",
    title: "Mini Assignment",
    priority: "High",
    context: "",
    dueOnISO: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    questions: [
      {
        id: "response",
        label: "Your answer",
        placeholder: "Type your answer here…",
        rows: 14,
      },
    ],
  };
}

export default function MiniAssignmentPage() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();

  const { triggerEvent } = useNotifications();
  usePageTimer(sessionUser?.mobile);
  const mobile = sessionUser?.mobile ? String(sessionUser.mobile) : "";

  const [config, setConfig] = useState<MiniAssignmentConfig>(defaultConfig);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const storageKey = useMemo(() => {
    const m = mobile || "unknown";
    return `mini_assignment_submission_v3:${m}:${config.assignmentId}`;
  }, [mobile, config.assignmentId]);

  const [draft, setDraft] = useState<SubmissionDraftV3>(() => ({
    version: 3,
    assignmentId: "mini-assignment-001",
    answers: {},
  }));

  const [busy, setBusy] = useState(false);
  const [serverSubmittedAtISO, setServerSubmittedAtISO] = useState<string | null>(null);

  const dueInDays = daysFromNow(config.dueOnISO);
  const isSubmitted = Boolean(draft.submittedAtISO || serverSubmittedAtISO);

  const saveDraft = (next: SubmissionDraftV3) => {
    const withMeta: SubmissionDraftV3 = {
      ...next,
      lastSavedAtISO: new Date().toISOString(),
    };
    setDraft(withMeta);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(withMeta));
    }
  };

  useEffect(() => {
    if (!ready || !mobile) return;

    const load = async () => {
      setLoadingConfig(true);
      try {
        const res = await fetch("/api/mini-assignment/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          config?: MiniAssignmentConfig;
          submission?: MiniAssignmentSubmission | null;
          message?: string;
        };
        if (!res.ok || !data?.success) {
          toast.error(data?.message || "Unable to load mini assignment.");
          setConfig(defaultConfig());
          return;
        }

        const nextConfig = data.config || defaultConfig();
        setConfig(nextConfig);

        const sub = data.submission || null;
        if (sub?.submittedAt) setServerSubmittedAtISO(sub.submittedAt);

        // If server has a submission, pre-fill answers into draft (read-only via isSubmitted).
        if (sub?.answers?.length) {
          const mapped: Record<string, string> = {};
          for (const a of sub.answers) {
            if (!a?.questionId) continue;
            mapped[String(a.questionId)] = String(a.answer || "");
          }
          setDraft((prev) => ({
            ...prev,
            version: 3,
            assignmentId: nextConfig.assignmentId,
            answers: { ...mapped },
            attachmentFileId: sub.attachmentFileId || prev.attachmentFileId,
            attachmentFileName: sub.attachmentFileName || prev.attachmentFileName,
            attachmentFileUrl: sub.attachmentFileId
              ? `/api/documents/file/${encodeURIComponent(sub.attachmentFileId)}`
              : prev.attachmentFileUrl,
            submittedAtISO: prev.submittedAtISO || (sub.submittedAt ? new Date(sub.submittedAt).toISOString() : undefined),
          }));
        } else {
          setDraft((prev) => ({
            ...prev,
            assignmentId: nextConfig.assignmentId,
          }));
        }
      } catch {
        toast.error("Network error while loading mini assignment.");
      } finally {
        setLoadingConfig(false);
      }
    };

    void load();
  }, [ready, mobile]);

  // Load local draft (and migrate older versions) once we know assignmentId
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mobile) return;

    const existingV3 = safeJsonParse<SubmissionDraftV3>(localStorage.getItem(storageKey));
    if (existingV3?.version === 3 && existingV3.assignmentId === config.assignmentId) {
      setDraft(existingV3);
      return;
    }

    const legacyV2Key = `mini_assignment_submission_v2:${mobile}:${config.assignmentId}`;
    const legacyV2 = safeJsonParse<{
      version: 2;
      assignmentId: string;
      executiveSummary: string;
      priorities30: string;
      priorities60: string;
      priorities90: string;
      stakeholders: string;
      risksAndDependencies: string;
      supportNeeded: string;
      fileName?: string;
      fileMime?: string;
      fileDataUrl?: string;
      lastSavedAtISO?: string;
      submittedAtISO?: string;
    }>(localStorage.getItem(legacyV2Key));

    if (legacyV2?.version === 2 && legacyV2.assignmentId === config.assignmentId) {
      const combined = [
        legacyV2.executiveSummary,
        legacyV2.priorities30,
        legacyV2.priorities60,
        legacyV2.priorities90,
        legacyV2.stakeholders,
        legacyV2.risksAndDependencies,
        legacyV2.supportNeeded,
      ]
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .join("\n\n");
      const migrated: SubmissionDraftV3 = {
        version: 3,
        assignmentId: config.assignmentId,
        answers: {
          response: combined,
        },
        attachmentFileName: legacyV2.fileName,
        lastSavedAtISO: legacyV2.lastSavedAtISO,
        submittedAtISO: legacyV2.submittedAtISO,
      };
      setDraft(migrated);
      localStorage.setItem(storageKey, JSON.stringify(migrated));
      return;
    }

    const legacyV1Key = `mini_assignment_submission_v1:${mobile}:${config.assignmentId}`;
    const legacyV1 = safeJsonParse<{
      version: 1;
      assignmentId: string;
      text: string;
      lastSavedAtISO?: string;
      submittedAtISO?: string;
    }>(localStorage.getItem(legacyV1Key));
    if (legacyV1?.version === 1 && legacyV1.assignmentId === config.assignmentId) {
      const migrated: SubmissionDraftV3 = {
        version: 3,
        assignmentId: config.assignmentId,
        answers: { response: legacyV1.text || "" },
        lastSavedAtISO: legacyV1.lastSavedAtISO,
        submittedAtISO: legacyV1.submittedAtISO,
      };
      setDraft(migrated);
      localStorage.setItem(storageKey, JSON.stringify(migrated));
    }
  }, [storageKey, config.assignmentId, mobile]);

  const qById = useMemo(() => {
    return Object.fromEntries(config.questions.map((q) => [q.id, q])) as Record<string, Question>;
  }, [config.questions]);

  const responseQuestion = qById.response ?? config.questions[0];

  if (!ready || !sessionUser) return <SessionLoading />;

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Mini Assignment"
            subtitle="Complete the deliverable and submit your response."
            titleEmoji="📋"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-800">Mini Assignment</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                Due {formatDate(config.dueOnISO)}
                {typeof dueInDays === "number" && (
                  <span className="ml-2 text-slate-400">
                    ({dueInDays <= 0 ? "today" : `${dueInDays}d`})
                  </span>
                )}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]"
          >
            {/* Deliverable */}
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Deliverable</p>
              <textarea
                value={config.context || ""}
                readOnly
                placeholder="Deliverable details will appear here."
                rows={18}
                className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </section>

            {/* Answer */}
            <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Your answer</p>
                <span className="text-xs font-medium text-slate-500">
                  {countWords(String(draft.answers.response || ""))} words
                </span>
              </div>

              <div
                className={[
                  "mt-3 rounded-2xl border p-4",
                  sectionTone(Boolean(String(draft.answers.response || "").trim())),
                ].join(" ")}
              >
                <textarea
                  value={String(draft.answers.response || "")}
                  onChange={(e) =>
                    saveDraft({
                      ...draft,
                      answers: { ...draft.answers, response: e.target.value },
                    })
                  }
                  disabled={isSubmitted}
                  placeholder={responseQuestion?.placeholder || "Type your answer here…"}
                  rows={responseQuestion?.rows || 14}
                  className={[
                    "w-full resize-none rounded-2xl border border-slate-200 bg-white p-3.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition",
                    isSubmitted ? "bg-slate-50" : "focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
                  ].join(" ")}
                />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {draft.lastSavedAtISO ? (
                  <>
                    Autosaved{" "}
                    <span className="font-medium text-slate-700">
                      {new Date(draft.lastSavedAtISO).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                ) : (
                  "Autosaves in your browser."
                )}
              </p>

              {/* Attachment */}
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-sm font-semibold text-slate-800">Attachment (optional)</p>
                <p className="mt-1 text-sm text-slate-500">PDF/DOC/DOCX up to 2 MB (uploaded to server).</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label
                    className={[
                      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition",
                      isSubmitted
                        ? "cursor-not-allowed bg-slate-300"
                        : "cursor-pointer bg-gradient-to-r from-primary to-secondary hover:opacity-95",
                    ].join(" ")}
                  >
                    <span className="text-base" aria-hidden>⬆️</span>
                    {draft.attachmentFileName ? "Replace file" : "Upload file"}
                    <input
                      type="file"
                      className="hidden"
                      disabled={isSubmitted}
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        void (async () => {
                          const max = 2 * 1024 * 1024;
                          if (f.size > max) {
                            toast.error("Please upload a file under 2 MB.");
                            return;
                          }
                          setBusy(true);
                          try {
                            const fd = new FormData();
                            fd.append("mobile", mobile);
                            fd.append("file", f);
                            const res = await fetch("/api/mini-assignment/upload", { method: "POST", body: fd });
                            const data = (await res.json()) as { success?: boolean; fileId?: string; fileUrl?: string; fileName?: string; message?: string };
                            if (!res.ok || !data?.success || !data.fileId) {
                              toast.error(data?.message || "Upload failed.");
                              return;
                            }
                            saveDraft({
                              ...draft,
                              attachmentFileId: data.fileId,
                              attachmentFileUrl: data.fileUrl,
                              attachmentFileName: data.fileName || f.name,
                            });
                            toast.success("Attachment uploaded.");
                          } catch {
                            toast.error("Upload failed. Please try again.");
                          } finally {
                            setBusy(false);
                          }
                        })();
                      }}
                    />
                  </label>

                  {draft.attachmentFileName && (
                    <>
                      <span className="text-xs font-medium text-slate-700">{draft.attachmentFileName}</span>
                      {draft.attachmentFileUrl && (
                        <a
                          href={draft.attachmentFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          Preview
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => {
                          saveDraft({
                            ...draft,
                            attachmentFileId: undefined,
                            attachmentFileUrl: undefined,
                            attachmentFileName: undefined,
                          });
                          toast("Attachment removed.");
                        }}
                        className={[
                          "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                          isSubmitted
                            ? "cursor-not-allowed border-slate-200 bg-white text-slate-400"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                        ].join(" ")}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {isSubmitted ? (
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Back to Dashboard
                  </button>
                ) : (
                  <>
                    <motion.button
                      type="button"
                      disabled={busy || loadingConfig}
                      whileHover={{ scale: busy || loadingConfig ? 1 : 1.01 }}
                      whileTap={{ scale: busy || loadingConfig ? 1 : 0.98 }}
                      onClick={() => {
                        void (async () => {
                          if (!String(draft.answers.response || "").trim()) {
                            toast.error("Please type your answer before submitting.");
                            return;
                          }
                          setBusy(true);
                          try {
                            const answers = [
                              {
                                questionId: "response",
                                answer: String(draft.answers.response || ""),
                              },
                            ];
                            const res = await fetch("/api/mini-assignment/submit", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                mobile,
                                assignmentId: config.assignmentId,
                                answers,
                                attachmentFileId: draft.attachmentFileId,
                                attachmentFileName: draft.attachmentFileName,
                              }),
                            });
                            const data = (await res.json()) as { success?: boolean; message?: string };
                            if (!res.ok || !data?.success) {
                              toast.error(data?.message || "Could not submit. Try again.");
                              return;
                            }
                            const nowIso = new Date().toISOString();
                            saveDraft({ ...draft, submittedAtISO: nowIso });
                            setServerSubmittedAtISO(nowIso);
                            toast.success("Submitted.");
                            triggerEvent("mini_assignment_submitted", "📋 Mini Assignment submitted.", "activity");
                          } catch {
                            toast.error("Network error. Please try again.");
                          } finally {
                            setBusy(false);
                          }
                        })();
                      }}
                      className={[
                        "w-full rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-md transition",
                        busy || loadingConfig
                          ? "cursor-not-allowed bg-slate-300 shadow-none"
                          : "bg-gradient-to-r from-primary to-secondary shadow-indigo-200/50 hover:opacity-90",
                      ].join(" ")}
                    >
                      {busy ? "Submitting…" : "Submit ✓"}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      Save & return later
                    </button>
                  </>
                )}
              </div>
            </aside>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

