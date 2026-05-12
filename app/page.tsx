"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SPLASH_DURATION_S = 2;

export default function Home() {
  const router = useRouter();
  const redirectedRef = useRef(false);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
    sessionStorage.clear();
  }, []);

  const goToLogin = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace("/login");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-800">
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.img
          src="/npci-logo.png"
          alt="NPCI Logo"
          className="h-24 w-24 object-contain"
          initial={{ scale: 1, opacity: 1 }}
          animate={{
            scale: [1, 2.5, 2.5],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: SPLASH_DURATION_S,
            times: [0, 0.72, 1],
            ease: "easeInOut",
          }}
          onAnimationComplete={goToLogin}
        />
      </div>
    </div>
  );
}
