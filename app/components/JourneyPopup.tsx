"use client";

import { motion, AnimatePresence } from "framer-motion";

type JourneyPopupProps = {
  open: boolean;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  onClose: () => void;
};

export function JourneyPopup({
  open,
  message,
  ctaLabel,
  onCta,
  onClose,
}: JourneyPopupProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed right-4 top-4 z-[70] w-[min(calc(100vw-2rem),22rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          role="status"
          aria-live="polite"
        >
          <p className="pr-6 text-sm leading-relaxed text-slate-700">{message}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close popup"
            className="absolute right-3 top-3 text-sm text-slate-400 transition hover:text-slate-600"
          >
            ✕
          </button>

          {ctaLabel && onCta && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onCta}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                {ctaLabel}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
