"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";

const videos = [
  {
    title: "NPCI Overview",
    url: "https://youtu.be/c8J0C2an8ko?si=-H4Xcx0qrEfKu4at",
  },
  {
    title: "Women's Day Podcast",
    url: "https://youtu.be/awPQ8oVOyQ0?si=NwAb4AZqGnuwljnZ",
  },
  {
    title: "Episode 1",
    url: "https://youtu.be/iqIlbXxfV5g?si=ufgfuSGfL_wQlMM1",
  },
  {
    title: "Episode 2",
    url: "https://youtu.be/osuR5mV8QGI?si=s4_L_nUI3_8FpFij",
  },
];

function getYoutubeId(url: string): string | undefined {
  const match = url.match(/(?:youtu\.be\/|v=)([^?&#]+)/);
  return match?.[1];
}

function youtubeThumbnail(url: string): string {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

function VideosContent() {
  const { ready, sessionUser } = useRequireSession();

  if (!ready || !sessionUser) {
    return <SessionLoading />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Learning"
            subtitle="Curated content to build context before Day 1."
            titleEmoji="🎥"
          />

          <motion.div
            key="deep-dive"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">
                Continue Learning
              </h2>

              <div className="flex gap-5 overflow-x-auto scroll-smooth pb-4 scrollbar-hide">
                {videos.map((video, index) => {
                  const thumbnail = youtubeThumbnail(video.url) || "/npci-logo.png";
                  return (
                    <motion.button
                      type="button"
                      key={index}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.open(video.url, "_blank")}
                      className="min-w-[280px] max-w-[280px] shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-white text-left shadow-md transition duration-300 ease-out hover:scale-105 hover:shadow-xl"
                    >
                      <div className="relative aspect-video w-full bg-slate-100">
                        <Image
                          src={thumbnail}
                          alt={video.title}
                          fill
                          sizes="280px"
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-white/80 p-3 shadow-lg">
                            ▶
                          </div>
                        </div>
                      </div>
                      <div className="px-3 pb-3 pt-2.5">
                        <p className="text-sm font-semibold leading-snug text-slate-800">
                          {video.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">YouTube</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function Videos() {
  return (
    <Suspense fallback={<SessionLoading />}>
      <VideosContent />
    </Suspense>
  );
}
