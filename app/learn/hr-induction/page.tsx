"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/PageHeader";
import { SessionLoading } from "../../components/SessionLoading";
import { useRequireSession } from "../../hooks/useRequireSession";

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
};

const MODULES: LearningModule[] = [
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
    title: "Policies & Code of Conduct",
    description:
      "Key HR policies, the code of conduct and what NPCI expects from every employee.",
    duration: "~12 min",
    emoji: "📜",
    gradient: "from-amber-500 to-orange-500",
    accent: "bg-amber-50 text-amber-700 ring-amber-100",
    status: "coming-soon",
  },
  {
    id: "module-4",
    number: 4,
    title: "Compensation & Benefits",
    description:
      "Understand your pay structure, benefits, leaves and wellness programs.",
    duration: "~9 min",
    emoji: "💼",
    gradient: "from-emerald-500 to-teal-500",
    accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    status: "coming-soon",
  },
  {
    id: "module-6",
    number: 6,
    title: "Your First 90 Days",
    description:
      "What to expect in your first three months and how to make the most of them.",
    duration: "~7 min",
    emoji: "🚀",
    gradient: "from-rose-500 to-red-500",
    accent: "bg-rose-50 text-rose-700 ring-rose-100",
    status: "coming-soon",
  },
];

export default function HRInductionModules() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();

  if (!ready || !sessionUser) {
    return <SessionLoading />;
  }

  const handleModuleClick = (module: LearningModule) => {
    if (module.status === "available" && module.href) {
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
            title="HR Induction"
            subtitle={`Your guided journey across ${MODULES.length} modules — complete them at your own pace.`}
            titleEmoji="🏛️"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-gray-300 hover:text-slate-900"
            >
              <span className="text-base" aria-hidden>←</span>
              Dashboard
            </button>

            <ul className="grid gap-4 sm:grid-cols-2">
              {MODULES.map((module, index) => {
                const isLocked = module.status === "coming-soon";
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
                          : "border-slate-100 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60",
                      ].join(" ")}
                    >
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
                          {isLocked ? "Coming soon" : `Module ${module.number}`}
                        </span>
                      </div>

                      <h3 className="mt-4 text-base font-semibold text-slate-900">
                        {module.title}
                      </h3>
                      <p className="mt-1 line-clamp-3 text-sm text-slate-500">
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
                          {isLocked ? "Locked" : "Start"}
                          <span aria-hidden>{isLocked ? "🔒" : "→"}</span>
                        </span>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
