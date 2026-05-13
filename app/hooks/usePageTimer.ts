"use client";

import { useEffect, useRef } from "react";
import { useNotifications } from "../context/NotificationContext";

const TIME_KEY_PREFIX = "npci_total_time_";

/**
 * Accumulates time the user spends on each page (in milliseconds, stored in
 * localStorage). Fires one-time notifications at 10-min and 30-min thresholds.
 *
 * Call on any authenticated page: `usePageTimer(sessionUser?.mobile)`
 */
export function usePageTimer(mobile: string | undefined) {
  const { triggerEvent } = useNotifications();

  // Stable ref so the cleanup closure always calls the latest triggerEvent
  const triggerRef = useRef(triggerEvent);
  triggerRef.current = triggerEvent;

  useEffect(() => {
    if (!mobile) return;

    const key = `${TIME_KEY_PREFIX}${mobile}`;
    const startMs = Date.now();

    return () => {
      const elapsed = Date.now() - startMs;
      if (elapsed < 2000) return; // ignore sub-2s blips (e.g. fast redirects)

      try {
        const prevTotal = Number(localStorage.getItem(key) ?? "0");
        const newTotal = prevTotal + elapsed;
        localStorage.setItem(key, String(newTotal));

        const prevMin = Math.floor(prevTotal / 60_000);
        const newMin = Math.floor(newTotal / 60_000);

        if (prevMin < 10 && newMin >= 10) {
          triggerRef.current(
            "time_10min",
            "You've spent 10 minutes exploring the app — keep going.",
            "time"
          );
        }
        if (prevMin < 30 && newMin >= 30) {
          triggerRef.current(
            "time_30min",
            "30 minutes in — you're getting a solid onboarding foundation.",
            "time"
          );
        }
      } catch { /* ignore */ }
    };
  }, [mobile]); // eslint-disable-line react-hooks/exhaustive-deps
}
