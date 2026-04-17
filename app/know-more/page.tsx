"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { parseSessionUser } from "@/app/lib/session";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";

type Question = {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
  placeholder: string;
  color: { bg: string; ring: string; text: string; glow: string };
};

const QUESTIONS: Question[] = [
  {
    id: "passion_work",
    emoji: "🔥",
    label: "Passion",
    prompt: "What are you most passionate about in life and work?",
    placeholder: "What drives you, what you care about most...",
    color: {
      bg: "from-violet-50 to-purple-50",
      ring: "ring-violet-200",
      text: "text-violet-700",
      glow: "bg-violet-400/20",
    },
  },
  {
    id: "colleagues_three_words",
    emoji: "💬",
    label: "How others see you",
    prompt:
      "If your friends or colleagues had to describe you in three words, what would they say?",
    placeholder: "Three words they might use about you...",
    color: {
      bg: "from-sky-50 to-cyan-50",
      ring: "ring-sky-200",
      text: "text-sky-700",
      glow: "bg-sky-400/20",
    },
  },
  {
    id: "skills_growth",
    emoji: "📈",
    label: "Growth",
    prompt:
      "What are some skills you're excited to learn or improve going forward?",
    placeholder: "Technical skills, soft skills, domains you want to grow in...",
    color: {
      bg: "from-emerald-50 to-teal-50",
      ring: "ring-emerald-200",
      text: "text-emerald-700",
      glow: "bg-emerald-400/20",
    },
  },
  {
    id: "buddy_support",
    emoji: "🌟",
    label: "Buddy support",
    prompt: "How can your buddy best support you during onboarding?",
    placeholder: "Check-ins, intros, tools, pacing — whatever helps you most...",
    color: {
      bg: "from-indigo-50 to-blue-50",
      ring: "ring-indigo-200",
      text: "text-indigo-700",
      glow: "bg-indigo-400/20",
    },
  },
];

function firstName(name: string) {
  const part = (name || "").trim().split(/\s+/)[0] || "";
  if (!part) return "";
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export default function KnowMorePage() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();

  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(QUESTIONS.map((q) => [q.id, ""]))
  );
  const [active, setActive] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (!ready) return;
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("buddyAnswers");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, string>;
        setAnswers((prev) => ({ ...prev, ...parsed }));
      } catch {
        /* ignore */
      }
    }
  }, [ready]);

  const setRef = useCallback(
    (id: string) => (el: HTMLTextAreaElement | null) => {
      textareaRefs.current[id] = el;
    },
    []
  );

  const handleChange = (id: string, val: string) => {
    setSaved(false);
    setAnswers((prev) => ({ ...prev, [id]: val }));
  };

  const filledCount = QUESTIONS.filter((q) => answers[q.id]?.trim()).length;
  const allFilled = filledCount === QUESTIONS.length;

  const handleSave = async () => {
    if (typeof window === "undefined") return;
    const u = parseSessionUser(localStorage.getItem("user"));
    if (!u?.mobile) {
      toast.error("Session expired. Please log in again.");
      return;
    }
    setSaving(true);
    try {
      const payload = QUESTIONS.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || "",
      }));
      const res = await fetch("/api/update-buddy-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: u.mobile, answers: payload }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d?.message || "Could not save. Try again.");
        return;
      }
      localStorage.setItem("buddyAnswers", JSON.stringify(answers));
      setSaved(true);
      toast.success("Your answers have been saved!");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !sessionUser) {
    return <SessionLoading />;
  }

  const greetingName = firstName(String(sessionUser.name || "")) || "there";

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-800">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-violet-200/40 via-indigo-200/30 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tl from-sky-200/40 via-cyan-200/25 to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-rose-100/30 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Know more"
            subtitle="Help your buddy understand you before Day 1."
            titleEmoji="🌱"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 overflow-hidden rounded-[22px] border border-white bg-gradient-to-r from-indigo-50 via-violet-50 to-sky-50 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Hi {greetingName}! Your buddy is curious about you. 👋
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  These answers are shared with your buddy to make your first
                  few days warmer. Be honest — the more you share, the better
                  the connection.
                </p>
              </div>
              <div className="shrink-0">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1">
                    {QUESTIONS.map((q) => (
                      <motion.div
                        key={q.id}
                        className={[
                          "h-2 w-2 rounded-full transition-colors",
                          answers[q.id]?.trim()
                            ? "bg-indigo-500"
                            : "bg-slate-200",
                        ].join(" ")}
                        animate={{
                          scale: answers[q.id]?.trim() ? [1, 1.3, 1] : 1,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    {filledCount}/{QUESTIONS.length}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            {QUESTIONS.map((q, i) => {
              const isActive = active === q.id;
              const isFilled = Boolean(answers[q.id]?.trim());

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.07,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <motion.div
                    layout
                    onClick={() => {
                      setActive(q.id);
                      setTimeout(
                        () => textareaRefs.current[q.id]?.focus(),
                        50
                      );
                    }}
                    className={[
                      "relative cursor-text overflow-hidden rounded-[20px] border bg-gradient-to-br p-5 transition-shadow",
                      q.color.bg,
                      isActive
                        ? `ring-2 ${q.color.ring} border-transparent shadow-lg`
                        : "border-white/80 shadow-sm hover:shadow-md",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl",
                        q.color.glow,
                      ].join(" ")}
                      aria-hidden
                    />

                    <div className="relative flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-xl shadow-sm">
                        {q.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={[
                              "text-[10px] font-bold uppercase tracking-widest",
                              q.color.text,
                            ].join(" ")}
                          >
                            {q.label}
                          </p>
                          {isFilled && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-xs text-emerald-600"
                            >
                              ✓ Answered
                            </motion.span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm font-semibold text-slate-800 sm:text-[15px]">
                          {q.prompt}
                        </p>

                        <AnimatePresence>
                          {(isActive || isFilled) && (
                            <motion.div
                              key="textarea"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <textarea
                                ref={setRef(q.id)}
                                value={answers[q.id]}
                                onChange={(e) =>
                                  handleChange(q.id, e.target.value)
                                }
                                onFocus={() => setActive(q.id)}
                                onBlur={() => {
                                  if (!answers[q.id]?.trim())
                                    setActive(null);
                                }}
                                placeholder={q.placeholder}
                                rows={3}
                                className="mt-3 w-full resize-none rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-300"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!isActive && !isFilled && (
                          <p className="mt-2 text-xs text-slate-400">
                            Tap to answer
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
          >
            <p className="order-2 text-xs text-slate-400 sm:order-1">
              {allFilled
                ? "All done! Save your answers below."
                : `${QUESTIONS.length - filledCount} question${QUESTIONS.length - filledCount === 1 ? "" : "s"} remaining`}
            </p>

            <div className="order-1 flex gap-3 sm:order-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                ← Back
              </button>

              <motion.button
                type="button"
                whileHover={saving ? undefined : { scale: 1.02 }}
                whileTap={saving ? undefined : { scale: 0.98 }}
                disabled={saving || filledCount === 0}
                onClick={handleSave}
                className={[
                  "inline-flex min-w-[9rem] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm transition",
                  saved
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : filledCount === 0
                      ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                      : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-200 hover:from-indigo-500 hover:to-violet-500",
                ].join(" ")}
              >
                {saving ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : saved ? (
                  "✓ Saved"
                ) : (
                  "Save answers"
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
