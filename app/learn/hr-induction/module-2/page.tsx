"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/module-2.mp4";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HRInductionModule2() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [ended, setEnded] = useState(false);
  const completionSentRef = useRef(false);

  const syncTime = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    setDuration(el.duration || 0);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onLoaded = () => setDuration(el.duration || 0);
    el.addEventListener("loadedmetadata", onLoaded);
    return () => el.removeEventListener("loadedmetadata", onLoaded);
  }, []);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      setEnded(false);
      void el
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  };

  const seek = (ratio: number) => {
    const el = videoRef.current;
    if (!el || !duration) return;
    el.currentTime = Math.min(duration, Math.max(0, ratio * duration));
    syncTime();
  };

  const onEnded = () => {
    setPlaying(false);
    setEnded(true);

    if (completionSentRef.current) return;
    completionSentRef.current = true;

    fetch("/api/mark-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "hr-induction-module-2" }),
    }).catch(() => {});
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={() => router.push("/learn/hr-induction")}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10"
        >
          <span aria-hidden>←</span>
          Back to modules
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-lg shadow-lg shadow-indigo-900/40">
            🎬
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-200/80">
              HR Induction · Module 2
            </p>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              Life at NPCI
            </h1>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-indigo-950/40">
          <div className="relative aspect-video w-full">
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              className="h-full w-full"
              onTimeUpdate={syncTime}
              onEnded={onEnded}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              controls
              playsInline
            />
          </div>

          <div className="border-t border-white/5 bg-slate-900/60 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause video" : "Play video"}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-900/50 transition hover:scale-[1.03]"
              >
                <span className="text-xl leading-none" aria-hidden>
                  {playing ? "⏸" : "▶"}
                </span>
              </button>

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  aria-label="Seek"
                  className="group relative block h-2 w-full overflow-hidden rounded-full bg-white/10"
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const ratio = (event.clientX - rect.left) / rect.width;
                    seek(ratio);
                  }}
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 transition-[width]"
                    style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
                  />
                </button>
                <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {ended && (
              <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                You&apos;ve finished Module 2. Great job — head back to pick your next module.
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/50">
          Continue exploring HR Induction modules to complete your learning path.
        </p>
      </div>
    </div>
  );
}
