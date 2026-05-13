"use client";

import { motion } from "framer-motion";
import { Newsreader } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/PageHeader";
import { SessionLoading } from "../../components/SessionLoading";
import { useRequireSession } from "../../hooks/useRequireSession";
import { useNotifications } from "../../context/NotificationContext";
import { usePageTimer } from "../../hooks/usePageTimer";

const DASHBOARD_TILE_FLAGS_KEY = "dashboard_tile_flags";
const INDUCTION_VISITED_KEY = "induction_visited_modules";

const moduleBlurb = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

type ModuleStatus = "available" | "coming-soon";

type LearningModule = {
  id: string;
  number: number;
  title: string;
  description: string;
  duration: string;
  emoji: string;
  gradient: string;
  accent: string;
  href?: string;
  status: ModuleStatus;
  /** When set, shown instead of "Module N" (e.g. PDF reader). */
  statusLabel?: string;
};

const MODULES: LearningModule[] = [
  {
    id: "culture-playbook",
    number: 1,
    title: "Culture playbook",
    description:
      "NPCI Group culture playbook — read in the built-in viewer, page by page (not a video).",
    duration: "PDF",
    emoji: "📘",
    gradient: "from-sky-500 to-indigo-600",
    accent: "bg-sky-50 text-sky-800 ring-sky-100",
    href: "/learn/hr-induction/culture-playbook",
    status: "available",
    statusLabel: "PDF read",
  },
  {
    id: "module-1",
    number: 1,
    title: "NPCI Way",
    description:
      "An interactive SCORM walkthrough introducing you to NPCI, its vision and the team.",
    duration: "~10 min",
    emoji: "🏛️",
    gradient: "from-indigo-500 to-violet-500",
    accent: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    href: "/learn/hr-induction/module-1",
    status: "available",
  },
  {
    id: "module-2",
    number: 2,
    title: "NPCI Employee Benefits",
    description:
      "A closer look at our culture, benefits and how we work together everyday.",
    duration: "~8 min",
    emoji: "🎬",
    gradient: "from-fuchsia-500 to-pink-500",
    accent: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100",
    href: "/learn/hr-induction/module-2",
    status: "available",
  },
  {
    id: "module-3",
    number: 3,
    title: "Performance Management & Rewards and Recognition",
    description:
      "Understand how performance is reviewed at NPCI and how rewards and recognition celebrate great work.",
    duration: "~4 min",
    emoji: "🏆",
    gradient: "from-amber-500 to-orange-500",
    accent: "bg-amber-50 text-amber-700 ring-amber-100",
    href: "/learn/hr-induction/module-3",
    status: "available",
  },
];

const ALL_MODULE_IDS = MODULES.filter((m) => m.status === "available").map((m) => m.id);

function readVisitedModules(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDUCTION_VISITED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function markInductionDone() {
  try {
    const raw = localStorage.getItem(DASHBOARD_TILE_FLAGS_KEY);
    const existing = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    if (!existing.hrInductionDone) {
      localStorage.setItem(DASHBOARD_TILE_FLAGS_KEY, JSON.stringify({ ...existing, hrInductionDone: true }));
    }
  } catch { /* ignore */ }
}

export default function HRInductionModules() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();
  const { triggerEvent } = useNotifications();
  usePageTimer(sessionUser?.mobile);
  const [visitedModules, setVisitedModules] = useState<string[]>(readVisitedModules);

  // If all modules were already visited in a previous session, mark induction done
  useEffect(() => {
    if (ALL_MODULE_IDS.every((id) => visitedModules.includes(id))) {
      markInductionDone();
    }
  }, [visitedModules]);

  if (!ready || !sessionUser) {
    return <SessionLoading />;
  }

  const handleModuleClick = (module: LearningModule) => {
    if (module.status === "available" && module.href) {
      const updated = visitedModules.includes(module.id)
        ? visitedModules
        : [...visitedModules, module.id];

      if (updated.length !== visitedModules.length) {
        setVisitedModules(updated);
        try {
          localStorage.setItem(INDUCTION_VISITED_KEY, JSON.stringify(updated));
          if (ALL_MODULE_IDS.every((id) => updated.includes(id))) {
            markInductionDone();
            triggerEvent("induction_complete", "🏛️ You've opened all induction modules.", "activity");
          }
        } catch { /* ignore */ }
      }

      router.push(module.href);
      return;
    }
    toast("This module will be available soon.", { icon: "⏳" });
  };

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Induction"
            subtitle={`Your guided journey across ${MODULES.length} modules — complete them at your own pace.`}
            titleEmoji="🏛️"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul className="grid gap-4 sm:grid-cols-2">
              {MODULES.map((module, index) => {
                const isLocked = module.status === "coming-soon";
                const isVisited = visitedModules.includes(module.id);
                return (
                  <motion.li
                    key={module.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: 0.04 * index,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleModuleClick(module)}
                      aria-label={`Open ${module.title}`}
                      className={[
                        "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white p-5 text-left shadow-sm transition",
                        isLocked
                          ? "cursor-not-allowed border-slate-100 opacity-90"
                          : isVisited
                            ? "border-emerald-200 hover:-translate-y-0.5 hover:shadow-lg"
                            : "border-slate-100 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60",
                      ].join(" ")}
                    >
                      {isVisited && (
                        <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          ✓ Opened
                        </span>
                      )}
                      <div
                        className={[
                          "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition group-hover:opacity-40",
                          module.gradient,
                        ].join(" ")}
                        aria-hidden
                      />

                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={[
                            "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow-md",
                            module.gradient,
                          ].join(" ")}
                          aria-hidden
                        >
                          {module.emoji}
                        </span>
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1",
                            isLocked
                              ? "bg-slate-50 text-slate-400 ring-slate-100"
                              : module.accent,
                          ].join(" ")}
                        >
                          {isLocked
                            ? "Coming soon"
                            : module.statusLabel ?? `Module ${module.number}`}
                        </span>
                      </div>

                      <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900">
                        {module.title}
                      </h3>
                      <p
                        className={[
                          moduleBlurb.className,
                          "mt-2 line-clamp-4 text-[15px] font-normal leading-[1.62] tracking-[0.012em]",
                          isLocked ? "text-slate-500" : "text-slate-700",
                          "[font-feature-settings:'kern'_1,'liga'_1,'onum'_1]",
                        ].join(" ")}
                      >
                        {module.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden>⏱</span>
                          {module.duration}
                        </span>
                        <span
                          className={[
                            "inline-flex items-center gap-1 text-sm font-semibold transition",
                            isLocked
                              ? "text-slate-300"
                              : "text-indigo-600 group-hover:translate-x-0.5",
                          ].join(" ")}
                        >
                          {isLocked
                            ? "Locked"
                            : module.statusLabel
                              ? "Open"
                              : "Start"}
                          <span aria-hidden>{isLocked ? "🔒" : "→"}</span>
                        </span>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-gray-300 hover:text-slate-900"
            >
              <span className="text-base" aria-hidden>←</span>
              Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
