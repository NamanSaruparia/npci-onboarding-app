"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

export default function Dashboard() {
  const router = useRouter();

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const userName = user?.email?.split("@")[0] || "User";

  const daysLeft = 5;

  // 🔥 REAL DATA FROM CONTEXT (UPDATED)
  const { uploadedDocs, totalDocs, setUploadedDocs } = useAppContext();

  const progress = Math.floor((uploadedDocs / totalDocs) * 100);

  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔔 EXISTING useEffect (UNCHANGED)
  useEffect(() => {
    setTimeout(() => setLoading(false), 900);

    setTimeout(() => {
      toast(`🚀 ${daysLeft} days to go — you're getting closer!`);
    }, 1500);

    if (uploadedDocs < totalDocs) {
      setTimeout(() => {
        toast(`📄 ${totalDocs - uploadedDocs} documents pending`);
      }, 3500);
    } else {
      setTimeout(() => {
        toast("✅ All documents completed!");
      }, 3500);
    }
  }, [uploadedDocs]);

  // 🔥 NEW useEffect (BACKEND FETCH)
  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.email) return;

      const res = await fetch("/api/get-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json();

      if (data?.user) {
        setUploadedDocs(data.user.uploadedDocs || 0);
      }
    };

    fetchUser();
  }, []);

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // 🔔 DYNAMIC NOTIFICATIONS
  const notifications: string[] = [];

  notifications.push(`👋 ${userName}, your onboarding is progressing well`);

  if (daysLeft > 3) {
    notifications.push(`🚀 ${daysLeft} days to go. You're on track`);
  } else {
    notifications.push(`⏳ ${daysLeft} days left. Wrap things up`);
  }

  if (uploadedDocs < totalDocs) {
    notifications.push(
      `📄 ${totalDocs - uploadedDocs} documents still pending`
    );
  } else {
    notifications.push(`✅ All documents submitted`);
  }

  if (progress < 50) {
    notifications.push(`👀 Getting started — keep going`);
  } else if (progress < 80) {
    notifications.push(`💪 Good progress — stay consistent`);
  } else {
    notifications.push(`🎯 Almost done — final stretch`);
  }

  notifications.push("🎥 New learning content available");
  notifications.push("🇮🇳 You're part of something impactful");

  return (
    <div className="min-h-screen bg-black text-white px-6 py-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome, {userName} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Let’s get you ready for Day 1
          </p>
        </div>

        <div className="flex items-center gap-5">

          {/* 🔔 NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-xl hover:scale-110 transition"
            >
              🔔
            </button>

            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 max-h-80 overflow-y-auto bg-gray-900 border border-white/10 rounded-xl p-3 shadow-2xl z-50">
                <h3 className="text-sm font-semibold mb-2">
                  Notifications
                </h3>

                <div className="space-y-2">
                  {notifications.map((note, i) => (
                    <div
                      key={i}
                      className="text-sm text-gray-300 bg-white/5 p-2 rounded-lg hover:bg-white/10 transition"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LOGO */}
          <img src="/npci-logo.png" className="w-10 h-10" />
        </div>
      </div>

      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl p-6 mb-8 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-green-500 opacity-90"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full"></div>

        <div className="relative z-10">
          <h2 className="text-xl font-semibold">
            🚀 {daysLeft} days to Day 1
          </h2>
          <p className="text-sm text-white/80 mt-1">
            You’re about to join NPCI — let’s finish strong
          </p>
        </div>
      </motion.div>

      {/* ACTION GRID */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-4 text-gray-300">
          Your Next Steps
        </h2>

        <div className="grid grid-cols-2 gap-5">

          <FeatureCard
            title="Upload Documents"
            icon="📄"
            onClick={() => router.push("/documents")}
          />

          <FeatureCard
            title="Watch Videos"
            icon="🎥"
            onClick={() => router.push("/videos")}
          />

          <FeatureCard
            title="Buddy Connect"
            icon="👥"
            onClick={() => alert("Coming soon")}
          />

          <FeatureCard
            title="Day 1 Plan"
            icon="📅"
            onClick={() => router.push("/timeline")}
          />

        </div>
      </div>

      {/* PROGRESS */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg">

        <h2 className="text-sm font-semibold mb-3 text-gray-300">
          Your Progress
        </h2>

        <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
            className="h-3 bg-gradient-to-r from-orange-500 to-green-500"
          />
        </div>

        <p className="text-sm text-gray-400 mt-2">
          {progress}% completed
        </p>
      </div>

      {/* 🧑‍💼 AVATAR */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-green-500 p-4 rounded-full cursor-pointer shadow-xl"
        onClick={() =>
          toast("Hi! I’ll guide you through your onboarding 🚀")
        }
      >
        🧑‍💼
      </motion.div>

    </div>
  );
}

// FEATURE CARD
function FeatureCard({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group relative bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-orange-500/20 to-green-500/20 blur-xl"></div>

      <span className="text-3xl relative z-10">
        {icon}
      </span>

      <span className="text-sm text-center text-gray-200 relative z-10">
        {title}
      </span>
    </motion.div>
  );
}