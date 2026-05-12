"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";

function firstNameFromStoredName(name: string) {
  const part = name.trim().split(/\s+/)[0] || "";
  if (!part) return "";
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export default function WelcomePage() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();
  const [showAvatar, setShowAvatar] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      setShowAvatar(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [ready]);

  if (!ready || !sessionUser) {
    return <SessionLoading />;
  }

  const greetingName =
    firstNameFromStoredName(String(sessionUser.name || "")) || "there";

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
              <div className="max-w-xl space-y-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Hi {greetingName}, I&apos;m Nishith Chaturvedi
                </h1>
                <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
                  Welcome to NPCI - G — let&apos;s begin your onboarding journey
                </p>
              </div>

              <motion.img
                src="/images/nishith.png"
                alt="Nishith Chaturvedi"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{
                  opacity: showAvatar ? 1 : 0,
                  scale: showAvatar ? 1 : 0.92,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-56 w-56 rounded-full object-cover shadow-sm ring-1 ring-slate-200 sm:h-64 sm:w-64"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 border-t border-gray-100 pt-6"
            >
              <p className="mb-3 text-sm font-medium text-slate-500">Click here</p>
              <button
                type="button"
                onClick={() => router.push("/welcome-message")}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 text-left transition hover:border-indigo-100 hover:bg-indigo-50 hover:shadow-sm sm:w-auto"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-slate-200">
                  💬
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Welcome message</p>
                  <p className="text-xs text-slate-500">Hear a personal welcome from leadership</p>
                </div>
              </button>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
