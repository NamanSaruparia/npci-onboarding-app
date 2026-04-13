"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const videos = [
  {
    title: "NPCI: Digital Payment Vision",
    description: "Official NPCI overview",
    url: "https://www.youtube.com/embed/c8J0C2an8ko",
    thumbnail: "https://img.youtube.com/vi/c8J0C2an8ko/0.jpg",
    tag: "Vision",
  },
  {
    title: "Podcast with Dilip Asbe on UPI and NPCI",
    description: "Leadership insights on digital payments",
    url: "https://www.youtube.com/embed/awPQ8oVOyQ0",
    thumbnail: "https://img.youtube.com/vi/awPQ8oVOyQ0/0.jpg",
    tag: "Leadership",
  },
  {
    title: "UPI Transaction Flow",
    description: "Step-by-step payment journey",
    url: "https://www.youtube.com/embed/wWDzhLSK1K8",
    thumbnail: "https://img.youtube.com/vi/wWDzhLSK1K8/0.jpg",
    tag: "Learning",
  },
  {
    title: "UPI System Design",
    description: "Understanding backend architecture",
    url: "https://www.youtube.com/embed/fqySz1Me2pI",
    thumbnail: "https://img.youtube.com/vi/fqySz1Me2pI/0.jpg",
    tag: "Technical",
  },
];

export default function Videos() {
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);

  return (
    <div className="min-h-screen bg-black text-white p-5">

      {/* HEADER */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">
          🎥 Learning & Leadership Hub
        </h1>
        <p className="text-gray-400 text-sm">
          Learn how NPCI powers India’s digital economy
        </p>
      </div>

      {/* MAIN PLAYER */}
      <motion.div
        key={selectedVideo.url}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <iframe
          width="100%"
          height="260"
          src={selectedVideo.url}
          title="video player"
          className="rounded-xl shadow-lg"
          allowFullScreen
        ></iframe>

        <div className="mt-3">
          <h2 className="text-lg font-semibold">
            {selectedVideo.title}
          </h2>

          <p className="text-gray-400 text-sm">
            {selectedVideo.description}
          </p>

          <span className="text-xs bg-blue-600 px-2 py-1 rounded-full mt-2 inline-block">
            {selectedVideo.tag}
          </span>
        </div>
      </motion.div>

      {/* VIDEO ROW */}
      <div>
        <h2 className="text-sm font-semibold mb-3">
          Continue Learning
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-2">

          {videos.map((video, index) => {
            const isActive = selectedVideo.url === video.url;

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedVideo(video)}
                className={`relative min-w-[220px] cursor-pointer ${
                  isActive ? "border-2 border-blue-500" : ""
                }`}
              >
                {/* THUMBNAIL */}
                <img
                  src={video.thumbnail}
                  alt="thumbnail"
                  className="rounded-lg"
                />

                {/* PLAY ICON */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/60 p-3 rounded-full">
                    ▶️
                  </div>
                </div>

                {/* NOW PLAYING */}
                {isActive && (
                  <span className="absolute top-2 left-2 text-xs bg-blue-600 px-2 py-1 rounded">
                    Now Playing
                  </span>
                )}

                {/* TITLE */}
                <p className="text-sm mt-2">{video.title}</p>

                {/* TAG */}
                <span className="text-xs text-gray-400">
                  {video.tag}
                </span>
              </motion.div>
            );
          })}

        </div>
      </div>

    </div>
  );
}