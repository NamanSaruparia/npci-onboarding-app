"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";

const AUDIO_SRC = "/welcome-audio.mp3";
const AVATAR_SRC = "/images/nishith.png";
const SPEAKER_NAME = "Nishith Chaturvedi";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function firstName(name: string) {
  const part = name.trim().split(/\s+/)[0] || "";
  if (!part) return "";
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export default function WelcomeMessagePage() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [ended, setEnded] = useState(false);

  const syncTime = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    setDuration(el.duration || 0);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoaded = () => {
      setDuration(el.duration || 0);
    };
    el.addEventListener("loadedmetadata", onLoaded);
    return () => el.removeEventListener("loadedmetadata", onLoaded);
  }, []);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      setEnded(false);
      void el.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const seek = (ratio: number) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = Math.min(duration, Math.max(0, ratio * duration));
    syncTime();
  };

  const greeting =
    firstName(String(sessionUser?.name || "")) || "there";

  if (!ready || !sessionUser) {
    return <SessionLoading />;
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-800">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.22),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(56,189,248,0.12),transparent),radial-gradient(ellipse_50%_40%_at_0%_80%,rgba(167,139,250,0.14),transparent)]" />

      <div className="relative mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Welcome message"
            subtitle="A personal note before you dive into Day 1 prep."
            titleEmoji="💬"
          />

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-lg shadow-indigo-100/40 backdrop-blur-sm sm:p-10"
          >
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-200/50 via-sky-200/30 to-transparent blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-violet-200/40 to-transparent blur-3xl"
              aria-hidden
            />

            <div className="relative flex flex-col items-center text-center">
              <p className="text-sm font-medium text-indigo-600">
                Hi {greeting},
              </p>
              <h1 className="mt-1 max-w-md text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {SPEAKER_NAME} has something for you
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
                Tap play and settle in — a short voice welcome to kick off your
                NPCI journey.
              </p>

              <div className="relative mt-10 flex flex-col items-center">
                <motion.div
                  animate={
                    playing
                      ? { scale: [1, 1.04, 1], opacity: [0.45, 0.75, 0.45] }
                      : { scale: 1, opacity: 0.35 }
                  }
                  transition={
                    playing
                      ? { repeat: Infinity, duration: 2.4, ease: "easeInOut" }
                      : { duration: 0.5 }
                  }
                  className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-indigo-400 via-sky-400 to-violet-500 blur-2xl"
                  aria-hidden
                />

                <motion.div
                  className="relative"
                  animate={playing ? { y: [0, -4, 0] } : { y: 0 }}
                  transition={
                    playing
                      ? { repeat: Infinity, duration: 3.2, ease: "easeInOut" }
                      : {}
                  }
                >
                  <div
                    className={[
                      "rounded-full p-1 transition-shadow duration-500",
                      playing
                        ? "shadow-[0_0_0_4px_rgba(99,102,241,0.25),0_20px_50px_-12px_rgba(79,70,229,0.45)]"
                        : "shadow-xl shadow-slate-200/80 ring-1 ring-slate-200/80",
                    ].join(" ")}
                  >
                    <Image
                      src={AVATAR_SRC}
                      alt={SPEAKER_NAME}
                      width={192}
                      height={192}
                      className="relative z-10 h-40 w-40 rounded-full object-cover sm:h-48 sm:w-48"
                    />
                  </div>
                </motion.div>

                <div
                  className="mt-8 flex h-12 items-end justify-center gap-1"
                  aria-hidden
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1 rounded-full bg-indigo-400"
                      animate={
                        playing
                          ? {
                              height: [10, 28 + (i % 3) * 8, 10],
                              opacity: [0.5, 1, 0.5],
                            }
                          : { height: 10, opacity: 0.25 }
                      }
                      transition={
                        playing
                          ? {
                              repeat: Infinity,
                              duration: 0.55 + i * 0.07,
                              ease: "easeInOut",
                              delay: i * 0.05,
                            }
                          : { duration: 0.3 }
                      }
                      style={{ height: 10 }}
                    />
                  ))}
                </div>
              </div>

              <audio
                ref={audioRef}
                src={AUDIO_SRC}
                preload="metadata"
                onTimeUpdate={syncTime}
                onEnded={() => {
                  setPlaying(false);
                  setEnded(true);
                  setCurrentTime(0);
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />

              <div className="mt-10 w-full max-w-md space-y-4">
                <div
                  className="group relative h-2 cursor-pointer rounded-full bg-slate-200/90"
                  role="slider"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                  aria-label="Playback position"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    seek((e.clientX - rect.left) / rect.width);
                  }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                    style={{ width: `${progress * 100}%` }}
                    layout
                  />
                  <motion.div
                    className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-600 shadow-md opacity-0 group-hover:opacity-100"
                    style={{ left: `calc(${progress * 100}% - 8px)` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs tabular-nums text-slate-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={togglePlay}
                    className="inline-flex min-w-[10.5rem] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:from-indigo-500 hover:to-sky-500"
                  >
                    <span className="text-lg" aria-hidden>
                      {playing ? "⏸" : "▶"}
                    </span>
                    {playing ? "Pause" : ended ? "Play again" : "Play message"}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => {
                      const el = audioRef.current;
                      if (!el) return;
                      el.pause();
                      el.currentTime = 0;
                      setPlaying(false);
                      setEnded(false);
                      syncTime();
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Rewind
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {ended && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-8 flex flex-col items-center gap-4"
                  >
                    <p className="max-w-md rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
                      You&apos;re all set — explore document tracker and learning
                      next from the dashboard.
                    </p>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => router.replace("/dashboard")}
                      className="rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
                    >
                      Begin Your Journey →
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
