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
                  Hi {greetingName}, I&apos;m Dilip Asbe
                </h1>
                <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
                  Welcome to NPCI — let&apos;s begin your onboarding journey
                </p>
                <button
                  type="button"
                  onClick={() => router.replace("/dashboard")}
                  className="mt-1 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  Begin Journey
                </button>
              </div>

              <motion.img
                src="/avatar.png"
                alt="Dilip Asbe"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{
                  opacity: showAvatar ? 1 : 0,
                  scale: showAvatar ? 1 : 0.92,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-56 w-56 rounded-full object-cover shadow-sm ring-1 ring-slate-200 sm:h-64 sm:w-64"
              />
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
