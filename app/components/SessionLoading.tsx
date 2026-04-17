"use client";

import { motion } from "framer-motion";

export function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 1.1,
          ease: "linear",
        }}
        className="h-11 w-11 rounded-full border-2 border-primary/30 border-t-primary"
      />
    </div>
  );
}
