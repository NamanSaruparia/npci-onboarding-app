"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";

// ─── Emoji scale ─────────────────────────────────────────────────────────────

const SCALE = [
  { value: 1, emoji: "😞", label: "Very Poor" },
  { value: 2, emoji: "😕", label: "Poor" },
  { value: 3, emoji: "😐", label: "Average" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Excellent" },
] as const;

type ScaleValue = 0 | 1 | 2 | 3 | 4 | 5;

function EmojiRating({
  value,
  onChange,
}: {
  value: ScaleValue;
  onChange: (v: ScaleValue) => void;
}) {
  const [hovered, setHovered] = useState<ScaleValue>(0);
  const active = hovered || value;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2.5 sm:gap-3">
      {SCALE.map((item) => {
        const isActive = active === item.value;
        return (
          <motion.button
            key={item.value}
            type="button"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(item.value as ScaleValue)}
            onMouseEnter={() => setHovered(item.value as ScaleValue)}
            onMouseLeave={() => setHovered(0)}
            aria-label={item.label}
            aria-pressed={value === item.value}
            className={[
              "flex flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 text-2xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50",
              isActive
                ? "border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-md shadow-indigo-200/40"
                : "border-slate-200 bg-white hover:border-slate-300",
            ].join(" ")}
          >
            <span>{item.emoji}</span>
            <span
              className={[
                "text-[10px] font-semibold leading-none",
                isActive ? "text-indigo-600" : "text-slate-400",
              ].join(" ")}
            >
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({
  index,
  label,
  hint,
  children,
}: {
  index: number;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
    >
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        Question {index}
      </p>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {hint && (
        <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      )}
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Answers = {
  q1: ScaleValue;
  q2: ScaleValue;
  q3: ScaleValue;
  q5: string;
  q6: string;
};

export default function OnboardingFeedbackSurveyPage() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();

  const [answers, setAnswers] = useState<Answers>({
    q1: 0,
    q2: 0,
    q3: 0,
    q5: "",
    q6: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!ready || !sessionUser) return <SessionLoading />;

  const set = <K extends keyof Answers>(key: K, val: Answers[K]) =>
    setAnswers((prev) => ({ ...prev, [key]: val }));

  const allRated = answers.q1 > 0 && answers.q2 > 0 && answers.q3 > 0;

  const handleSubmit = async () => {
    if (!allRated) {
      toast.error("Please rate all three questions before submitting.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/save-feedback-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: sessionUser.mobile,
          q1: answers.q1,
          q2: answers.q2,
          q3: answers.q3,
          q5: answers.q5,
          q6: answers.q6,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Could not save your response. Try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          title="Onboarding Feedback Survey"
          subtitle="Share your experience of the last 30 days."
          titleEmoji="📝"
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          {submitted ? (
            /* ── Success state ──────────────────────────────────────────── */
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 px-6 py-12 text-center shadow-xl shadow-indigo-300/30"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-5 flex justify-center"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-5xl shadow-inner shadow-white/10">
                  🎉
                </span>
              </motion.div>

              <h2 className="mb-2 text-2xl font-bold text-white">
                You&apos;ve completed your journey!
              </h2>
              <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-indigo-100">
                Thank you for completing the Onboarding Feedback Survey. Your insights
                will help us make NPCI an even better place to begin your career.
                Welcome to the family — this is just the beginning. 🚀
              </p>

              <div className="mx-auto mb-8 max-w-sm rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-left backdrop-blur-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-200">
                  What&apos;s next
                </p>
                <p className="text-sm text-white/90 leading-relaxed">
                  Your manager will connect with you soon to discuss your goals
                  and next milestones. Keep growing!
                </p>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/dashboard")}
                className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-indigo-600 shadow-lg shadow-indigo-900/20 transition hover:bg-indigo-50"
              >
                Back to Dashboard
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* Hero intro banner */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 px-6 py-5 shadow-lg"
              >
                <p className="text-xs font-medium uppercase tracking-widest text-indigo-200 mb-1">
                  Final milestone
                </p>
                <h2 className="text-lg font-bold text-white mb-1">
                  30-Day Onboarding Survey
                </h2>
                <p className="text-sm text-indigo-100">
                  This is the last step of your onboarding journey. Your honest
                  feedback shapes NPCI&apos;s future onboarding programmes.
                </p>
              </motion.div>

              {/* Q1 */}
              <QuestionCard
                index={1}
                label="How would you rate your overall onboarding experience at NPCI?"
              >
                <EmojiRating value={answers.q1} onChange={(v) => set("q1", v)} />
              </QuestionCard>

              {/* Q2 */}
              <QuestionCard
                index={2}
                label="How easy was it to use the onboarding platform?"
                hint="1 – Very Difficult · 5 – Very Easy"
              >
                <EmojiRating value={answers.q2} onChange={(v) => set("q2", v)} />
              </QuestionCard>

              {/* Q3 */}
              <QuestionCard
                index={3}
                label="How comfortable do you feel in your role after the first 30 days?"
                hint="1 – Not comfortable · 5 – Fully settled in"
              >
                <EmojiRating value={answers.q3} onChange={(v) => set("q3", v)} />
              </QuestionCard>

              {/* Q4 */}
              <QuestionCard
                index={4}
                label="Which part of the onboarding journey helped you the most?"
              >
                <textarea
                  value={answers.q5}
                  onChange={(e) => set("q5", e.target.value)}
                  placeholder="Share what made the biggest difference for you…"
                  rows={4}
                  className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </QuestionCard>

              {/* Q5 */}
              <QuestionCard
                index={5}
                label="What could have been done better in your onboarding experience?"
              >
                <textarea
                  value={answers.q6}
                  onChange={(e) => set("q6", e.target.value)}
                  placeholder="Your honest feedback helps us improve for future joiners…"
                  rows={4}
                  className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </QuestionCard>

              {/* Submit */}
              <motion.button
                type="button"
                onClick={() => { void handleSubmit(); }}
                disabled={saving}
                whileHover={{ scale: allRated && !saving ? 1.01 : 1 }}
                whileTap={{ scale: allRated && !saving ? 0.98 : 1 }}
                className={[
                  "w-full rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-md transition",
                  allRated && !saving
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 shadow-indigo-200/50 hover:opacity-90"
                    : "cursor-not-allowed bg-slate-300 shadow-none",
                ].join(" ")}
              >
                {saving ? "Saving…" : "Submit Feedback Survey ✓"}
              </motion.button>
            </>
          )}

          {!submitted && (
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              <span aria-hidden>←</span> Dashboard
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
