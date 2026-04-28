"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";

// ─── Emoji scale ────────────────────────────────────────────────────────────

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
    <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4">
      {SCALE.map((item) => {
        const isActive = active === item.value;
        return (
          <motion.button
            key={item.value}
            type="button"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(item.value as ScaleValue)}
            onMouseEnter={() => setHovered(item.value as ScaleValue)}
            onMouseLeave={() => setHovered(0)}
            aria-label={item.label}
            aria-pressed={value === item.value}
            className={[
              "flex flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 text-2xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              isActive
                ? "border-primary/40 bg-gradient-to-br from-primary/10 to-secondary/10 shadow-md shadow-indigo-200/40"
                : "border-slate-200 bg-white hover:border-slate-300",
            ].join(" ")}
          >
            <span>{item.emoji}</span>
            <span
              className={[
                "text-[10px] font-semibold leading-none",
                isActive ? "text-primary" : "text-slate-400",
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

// ─── Question card ───────────────────────────────────────────────────────────

function QuestionCard({
  index,
  label,
  children,
}: {
  index: number;
  label: string;
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
      {children}
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Answers = {
  q1: ScaleValue;
  q2: ScaleValue;
  q3: ScaleValue;
  q4: string;
};

export default function CheckIn() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();

  const [answers, setAnswers] = useState<Answers>({
    q1: 0,
    q2: 0,
    q3: 0,
    q4: "",
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
      const res = await fetch("/api/save-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: sessionUser.mobile,
          q1: answers.q1,
          q2: answers.q2,
          q3: answers.q3,
          q4: answers.q4,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Could not save your response. Try again.");
        return;
      }
      setSubmitted(true);
      toast.success("Thank you for your feedback! 🎉");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          title="Mid Journey Check-In"
          subtitle="Help us understand your onboarding experience."
          titleEmoji="📅"
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mb-2 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-gray-300 hover:text-slate-900"
          >
            <span aria-hidden>←</span> Dashboard
          </button>

          {submitted ? (
            // ── Success state ──────────────────────────────────────────────
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-green-100 bg-green-50 px-6 py-12 text-center shadow-sm"
            >
              <span className="text-5xl">🎉</span>
              <h2 className="text-xl font-semibold text-slate-800">
                Response submitted!
              </h2>
              <p className="max-w-xs text-sm text-slate-500">
                Thank you for sharing your thoughts. Your feedback helps us make
                onboarding better for everyone.
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="mt-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200/40 transition hover:opacity-90"
              >
                Back to Dashboard
              </button>
            </motion.div>
          ) : (
            <>
              {/* Q1 */}
              <QuestionCard index={1} label="How has your overall onboarding experience been till now?">
                <EmojiRating value={answers.q1} onChange={(v) => set("q1", v)} />
              </QuestionCard>

              {/* Q2 */}
              <QuestionCard index={2} label="Have your initial expectations been met?">
                <EmojiRating value={answers.q2} onChange={(v) => set("q2", v)} />
              </QuestionCard>

              {/* Q3 */}
              <QuestionCard index={3} label="How helpful has your buddy been in your onboarding journey?">
                <EmojiRating value={answers.q3} onChange={(v) => set("q3", v)} />
              </QuestionCard>

              {/* Q4 — text */}
              <QuestionCard index={4} label="What has been the most positive part about your journey?">
                <textarea
                  value={answers.q4}
                  onChange={(e) => set("q4", e.target.value)}
                  placeholder="Share your experience…"
                  rows={4}
                  className="mt-3 w-full resize-none rounded-xl border border-slate-200 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
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
                    ? "bg-gradient-to-r from-primary to-secondary shadow-indigo-200/50 hover:opacity-90"
                    : "cursor-not-allowed bg-slate-300 shadow-none",
                ].join(" ")}
              >
                {saving ? "Saving…" : "Submit Check-In ✓"}
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
