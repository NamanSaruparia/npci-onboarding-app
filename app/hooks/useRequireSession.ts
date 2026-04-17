"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseSessionUser, type SessionUser } from "@/app/lib/session";

/**
 * Guards app routes that require an OTP session. Redirects to /login if missing or invalid.
 */
export function useRequireSession() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  // Mount-only (empty deps): avoid `router` in deps — it can change and re-run after OTP.
  // useEffect (not useLayoutEffect) avoids dev HMR hook-arity mismatches with this hook.
  useEffect(() => {
    const u = parseSessionUser(localStorage.getItem("user"));
    if (!u?.mobile) {
      router.replace("/login");
      return;
    }
    setSessionUser(u);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only gate
  }, []);

  const replaceSession = useCallback((next: SessionUser) => {
    localStorage.setItem("user", JSON.stringify(next));
    setSessionUser(next);
  }, []);

  return { ready, sessionUser, replaceSession };
}
