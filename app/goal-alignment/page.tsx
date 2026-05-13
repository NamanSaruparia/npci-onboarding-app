"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";
import { parseSessionUser } from "@/app/lib/session";
import { usePageTimer } from "../hooks/usePageTimer";
import {
  formatLongDate,
  goalFirstDraftDueIso,
  parseJoiningIso,
} from "@/app/lib/onboarding-dates";

type GoalArea = {
  title: string;
  subtitle: string;
  icon: string;
};

const GOAL_AREAS: GoalArea[] = [
  {
    title: "Job Fundamentals (Max 3)",
    subtitle: "Your core responsibilities and day-to-day deliverables.",
    icon: "🧱",
  },
  {
    title: "Impact Goals (Top 3)",
    subtitle: "Key outcomes you will drive — focus on measurable business impact.",
    icon: "🚀",
  },
  {
    title: "Individual Growth Goal (1)",
    subtitle: "A skill or capability you want to develop.",
    icon: "📈",
  },
];

export default function GoalAlignmentPage() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();
  usePageTimer(sessionUser?.mobile);
  const joiningFromSession = useMemo(
    () => parseJoiningIso(sessionUser?.dayOfJoining),
    [sessionUser?.dayOfJoining],
  );
  /** `undefined` until `/api/get-user` returns — then server value wins (may be null). */
  const [joiningFromApi, setJoiningFromApi] = useState<string | null | undefined>(undefined);

  const goalAlignmentUrl = "";

  const joiningIso =
    joiningFromApi !== undefined ? joiningFromApi : joiningFromSession;

  useEffect(() => {
    if (!ready || !sessionUser?.mobile) return;
    let cancelled = false;
    const run = async () => {
      try {
        const u = parseSessionUser(
          typeof window !== "undefined" ? localStorage.getItem("user") : null
        );
        const mobile = sessionUser.mobile || u?.mobile;
        if (!mobile) return;
        const res = await fetch("/api/get-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile }),
        });
        const data = await res.json();
        if (cancelled || !data?.user) return;
        setJoiningFromApi(parseJoiningIso(data.user.dayOfJoining));
      } catch {
        /* keep session-derived value */
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [ready, sessionUser?.mobile]);

  const timelineCopy = useMemo(() => {
    if (!joiningIso) {
      return {
        headline:
          "Your draft deadline will show here once HR sets your date of joining.",
        detail: "",
      };
    }
    const due = goalFirstDraftDueIso(joiningIso);
    if (!due) {
      return {
        headline: "Unable to compute your draft deadline from the stored joining date.",
        detail: "Ask HR to verify your date of joining.",
      };
    }
    return {
      headline: `Submit your 1st draft by ${formatLongDate(due)}`,
      detail: "",
    };
  }, [joiningIso]);

  if (!ready || !sessionUser) return <SessionLoading />;

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Goal Alignment"
            subtitle="Framework & timelines for setting your goals."
            titleEmoji="🎯"
          />

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-indigo-50 to-white shadow-sm"
          >
            <div className="px-6 py-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700/80">
                  What you need to do
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  Set your goals under 3 areas
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Keep them concise, measurable, and aligned to outcomes.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {GOAL_AREAS.map((area, idx) => (
                  <motion.div
                    key={area.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: idx * 0.06 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-xl">
                        {area.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {area.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {area.subtitle}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Timeline
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {timelineCopy.headline}
                  </p>
                  {timelineCopy.detail ? (
                    <p className="mt-1 text-sm text-slate-500">{timelineCopy.detail}</p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Next step
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    When you’re ready, open the goal-alignment page to create your draft and submit for review.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: goalAlignmentUrl ? 1.01 : 1 }}
                      whileTap={{ scale: goalAlignmentUrl ? 0.98 : 1 }}
                      onClick={() => {
                        if (!goalAlignmentUrl) {
                          toast("Goal alignment link will be shared soon.");
                          return;
                        }
                        window.open(goalAlignmentUrl, "_blank");
                      }}
                      className={[
                        "rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition",
                        goalAlignmentUrl
                          ? "bg-gradient-to-r from-primary to-secondary shadow-indigo-200/50 hover:opacity-90"
                          : "cursor-not-allowed bg-slate-300 shadow-none",
                      ].join(" ")}
                    >
                      Open Goal Alignment →
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
