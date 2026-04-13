"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [showAvatar, setShowAvatar] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAvatar(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden">
      
      <div className="relative w-full h-full flex items-center justify-center">

        {/* LOGO */}
        <motion.img
          src="/npci-logo.png"
          alt="NPCI Logo"
          initial={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          animate={{
            scale: [1, 1.8, 2.5],
            opacity: showAvatar ? 0 : 1,
            filter: showAvatar ? "blur(10px)" : "blur(0px)",
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
          }}
          className="w-48 h-48 object-contain absolute drop-shadow-[0_0_40px_#3b82f6]"
        />

        {/* LIGHT FLASH */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showAvatar ? 0.2 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute w-96 h-96 bg-white rounded-full blur-3xl"
        />

        {/* AVATAR CUTOUT (GAME STYLE) */}
        <motion.img
          src="/avatar.png"
          alt="avatar"
          initial={{ x: 300, opacity: 0, scale: 0.8 }}
          animate={{
            x: showAvatar ? 0 : 300,
            opacity: showAvatar ? 1 : 0,
            scale: showAvatar ? 1 : 0.8,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
          className="absolute bottom-0 right-10 h-[70%] object-contain"
        />

        {/* TEXT + CTA */}
        {showAvatar && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute left-10 bottom-20 max-w-md"
          >
            <h1 className="text-2xl font-semibold mb-2">
              Hi Naman,
            </h1>

            <h2 className="text-lg text-blue-400 mb-3">
              I’m Dilip Asbe
            </h2>

            <p className="text-gray-400 mb-4">
              Welcome to NPCI — the backbone of India’s digital payments.
            </p>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2 bg-blue-600 rounded-full hover:bg-blue-700 transition"
            >
              Begin Journey →
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 border border-white/30 rounded-full text-sm hover:bg-white hover:text-black transition"
            >
              Already have an account? Login
            </button>
          </motion.div>
          
        )}

      </div>
    </div>
  );
}