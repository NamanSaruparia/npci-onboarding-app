"use client";

import { motion } from "framer-motion";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";

export default function Timeline() {
  const { ready, sessionUser } = useRequireSession();

  const steps = [
    { day: "Day -10", task: "Download app and begin onboarding", emoji: "📲" },
    { day: "Day -5", task: "Upload required documents", emoji: "📄" },
    { day: "Day -2", task: "Complete learning modules", emoji: "🎥" },
    { day: "Day 0", task: "Join NPCI and start your journey", emoji: "🚀" },
  ];

  if (!ready || !sessionUser) {
    return <SessionLoading />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Timeline"
            subtitle="A structured journey from pre-boarding to Day 1."
            titleEmoji="🗺️"
          />

          <section className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff4e5] text-xl">
                  {step.emoji}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">{step.day}</p>
                  <p className="text-sm text-gray-500">{step.task}</p>
                </div>
              </motion.div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}