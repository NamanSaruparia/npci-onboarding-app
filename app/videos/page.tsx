"use client";

import { Suspense, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";

// ─── Video catalogue ──────────────────────────────────────────────────────────

type VideoEntry = {
  id: string;
  title: string;
  description: string;
  tag: string;
  /** YouTube URL — omit for local videos */
  url?: string;
  /** Path under /public for local MP4s */
  localSrc?: string;
};

const videos: VideoEntry[] = [
  {
    id: "c8J0C2an8ko",
    title: "NPCI Overview",
    description: "",
    tag: "Overview",
    url: "https://youtu.be/c8J0C2an8ko?si=-H4Xcx0qrEfKu4at",
  },
  {
    id: "awPQ8oVOyQ0",
    title: "Women's Day Podcast",
    description:
      "A special podcast celebrating the remarkable women of NPCI — their stories, journeys, and contributions to India's fintech revolution.",
    tag: "Podcast",
    url: "https://youtu.be/awPQ8oVOyQ0?si=NwAb4AZqGnuwljnZ",
  },
  {
    id: "iqIlbXxfV5g",
    title: "Episode 1",
    description:
      "The first episode of our leadership series — conversations with senior leaders about culture, growth, and what it means to be part of NPCI.",
    tag: "Series",
    url: "https://youtu.be/iqIlbXxfV5g?si=ufgfuSGfL_wQlMM1",
  },
  {
    id: "osuR5mV8QGI",
    title: "Episode 2",
    description:
      "Continuing the conversation — insights on innovation, purpose-driven work, and building a career in India's most impactful fintech organisation.",
    tag: "Series",
    url: "https://youtu.be/osuR5mV8QGI?si=s4_L_nUI3_8FpFij",
  },
];

const TAG_COLORS: Record<string, string> = {
  Overview: "bg-violet-100 text-violet-600",
  Podcast:  "bg-rose-100 text-rose-600",
  Series:   "bg-amber-100 text-amber-700",
};

const ALL_TAGS = ["All", ...Array.from(new Set(videos.map((v) => v.tag)))];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function youtubeThumbnail(id: string) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// ─── Local video hero card ────────────────────────────────────────────────────

function LocalVideoHeroCard({ video }: { video: VideoEntry }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setPlaying(true);
    setTimeout(() => videoRef.current?.play(), 50);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative w-full overflow-hidden rounded-[22px] text-left shadow-xl shadow-indigo-200/30"
    >
      <div className="relative aspect-video w-full bg-slate-900">
        {/* Video element */}
        <video
          ref={videoRef}
          src={video.localSrc}
          controls={playing}
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />

        {/* Overlay shown before play */}
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/70 via-black/30 to-black/10">
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-indigo-600 backdrop-blur-sm shadow-sm">
              ✨ Featured
            </span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlay}
              className="flex h-18 w-18 items-center justify-center rounded-full bg-white/90 p-5 shadow-2xl backdrop-blur-sm transition hover:bg-white"
            >
              <span className="ml-1 text-3xl text-indigo-600">▶</span>
            </motion.button>
            <p className="mt-3 text-sm font-semibold text-white/90 drop-shadow">
              {video.title}
            </p>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-4">
        <span className="mb-1.5 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white">
          {video.tag}
        </span>
        <h3 className="text-base font-bold text-white">{video.title}</h3>
        {video.description && (
          <p className="mt-0.5 text-sm leading-relaxed text-indigo-100">
            {video.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── YouTube hero card ────────────────────────────────────────────────────────

function YoutubeHeroCard({ video }: { video: VideoEntry }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => video.url && window.open(video.url, "_blank")}
      className="group relative w-full overflow-hidden rounded-[22px] text-left shadow-xl shadow-indigo-200/30"
    >
      <div className="relative aspect-video w-full bg-slate-200">
        <Image
          src={youtubeThumbnail(video.id)}
          alt={video.title}
          fill
          sizes="100vw"
          unoptimized
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-2xl backdrop-blur-sm transition group-hover:bg-white"
          >
            <span className="ml-1 text-2xl text-indigo-600">▶</span>
          </motion.div>
        </div>
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-indigo-600 backdrop-blur-sm shadow-sm">
          ✨ Featured
        </span>
      </div>
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-4">
        <span className="mb-1.5 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white">
          {video.tag}
        </span>
        <h3 className="text-base font-bold text-white">{video.title}</h3>
        {video.description && (
          <p className="mt-0.5 text-sm leading-relaxed text-indigo-100">
            {video.description}
          </p>
        )}
      </div>
    </motion.button>
  );
}

function HeroCard({ video }: { video: VideoEntry }) {
  return video.localSrc
    ? <LocalVideoHeroCard video={video} />
    : <YoutubeHeroCard video={video} />;
}

// ─── Regular video card ───────────────────────────────────────────────────────

function VideoCard({ video, index }: { video: VideoEntry; index: number }) {
  const isLocal = Boolean(video.localSrc);

  const handleClick = () => {
    if (video.url) window.open(video.url, "_blank");
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition-all hover:shadow-lg hover:shadow-indigo-100/50"
    >
      {/* Thumbnail / poster */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        {isLocal ? (
          <video
            src={video.localSrc}
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={youtubeThumbnail(video.id)}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            unoptimized
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
            <span className="ml-0.5 text-base text-indigo-600">▶</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span
          className={[
            "w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
            TAG_COLORS[video.tag] ?? "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          {video.tag}
        </span>
        <p className="text-sm font-bold leading-snug text-slate-800">
          {video.title}
        </p>
        {video.description && (
          <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-2">
            {video.description}
          </p>
        )}
        {!isLocal && (
          <div className="mt-auto flex items-center gap-1.5 pt-1">
            <span className="text-[10px] font-medium text-indigo-500">Watch on YouTube</span>
            <span className="text-[10px] text-indigo-400">→</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function VideosContent() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();
  const [activeTag, setActiveTag] = useState("All");

  if (!ready || !sessionUser) return <SessionLoading />;

  const featured = videos[0];
  const rest = videos.slice(1);
  const filtered =
    activeTag === "All" ? rest : rest.filter((v) => v.tag === activeTag);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-[24px] p-4 sm:p-6">
          <PageHeader
            title="NPCI Deep Dive"
            subtitle="Curated content to build context before Day 1."
            titleEmoji="🎥"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {/* Stats strip */}
            <div className="flex items-center gap-4 overflow-x-auto rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-5 py-3.5 shadow-sm">
              <div className="shrink-0 text-center">
                <p className="text-lg font-bold text-indigo-600">{videos.length}</p>
                <p className="text-[10px] font-medium text-slate-500">Videos</p>
              </div>
              <div className="h-8 w-px shrink-0 bg-indigo-100" />
              <div className="shrink-0 text-center">
                <p className="text-lg font-bold text-indigo-600">{ALL_TAGS.length - 1}</p>
                <p className="text-[10px] font-medium text-slate-500">Categories</p>
              </div>
              <div className="h-8 w-px shrink-0 bg-indigo-100" />
              <p className="text-xs text-slate-500 leading-snug">
                Handpicked sessions to help you understand NPCI before Day 1.
              </p>
            </div>

            {/* Featured video */}
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Featured
              </p>
              <HeroCard video={featured} />
            </section>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <motion.button
                  key={tag}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTag(tag)}
                  className={[
                    "rounded-xl border px-4 py-1.5 text-xs font-semibold transition",
                    activeTag === tag
                      ? "border-indigo-300 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200/40"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200",
                  ].join(" ")}
                >
                  {tag}
                </motion.button>
              ))}
            </div>

            {/* Video grid */}
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {activeTag === "All" ? "All Videos" : activeTag}
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTag}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  {filtered.length === 0 ? (
                    <p className="col-span-2 text-sm text-slate-400">
                      No videos in this category yet.
                    </p>
                  ) : (
                    filtered.map((video, i) => (
                      <VideoCard key={video.id} video={video} index={i} />
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </section>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              <span aria-hidden>←</span> Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function Videos() {
  return (
    <Suspense fallback={<SessionLoading />}>
      <VideosContent />
    </Suspense>
  );
}
