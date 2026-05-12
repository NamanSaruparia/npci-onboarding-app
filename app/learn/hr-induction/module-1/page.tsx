"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

type Scorm12Api = {
  LMSInitialize: () => string;
  LMSFinish: () => string;
  LMSGetValue: (key: string) => string;
  LMSSetValue: () => string;
  LMSCommit: () => string;
  LMSGetLastError: () => string;
  LMSGetErrorString: () => string;
  LMSGetDiagnostic: () => string;
};

type Scorm2004Api = {
  Initialize: () => string;
  Terminate: () => string;
  GetValue: (key: string) => string;
  SetValue: () => string;
  Commit: () => string;
  GetLastError: () => string;
  GetErrorString: () => string;
  GetDiagnostic: () => string;
};

export default function HRInductionModule1() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const syncDashboardNavigation = useCallback(() => {
    try {
      const framePath = iframeRef.current?.contentWindow?.location?.pathname;
      if (framePath === "/dashboard") {
        window.location.replace("/dashboard");
      }
    } catch {
      // Ignore cross-frame/location access issues safely.
    }
  }, []);

  useEffect(() => {
    const preservedUserSession = localStorage.getItem("user");

    const restoreUserSession = () => {
      if (!preservedUserSession) return;
      const currentUser = localStorage.getItem("user");
      if (currentUser !== preservedUserSession) {
        localStorage.setItem("user", preservedUserSession);
      }
    };

    const scormWindow = window as Window & {
      API?: Scorm12Api;
      API_1484_11?: Scorm2004Api;
    };

    const clearScormResumeKeys = (storage: Storage) => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (!key) continue;

        const normalized = key.toLowerCase();
        const isScormKey =
          normalized.includes("scorm") ||
          normalized.includes("cmi") ||
          normalized.includes("suspend") ||
          normalized.includes("lesson") ||
          normalized.includes("adl");

        if (isScormKey) keysToRemove.push(key);
      }

      keysToRemove.forEach((key) => storage.removeItem(key));
    };

    // Keep app/session keys (like "user") intact; clear only SCORM resume traces.
    clearScormResumeKeys(localStorage);
    clearScormResumeKeys(sessionStorage);
    restoreUserSession();

    // Some SCORM packages touch localStorage; keep session key stable for dashboard auth.
    const sessionGuard = window.setInterval(restoreUserSession, 1000);
    const dashboardNavGuard = window.setInterval(syncDashboardNavigation, 400);

    // Mock SCORM 1.2 API
    scormWindow.API = {
      LMSInitialize: () => "true",
      LMSFinish: () => "true",
      LMSGetValue: (key: string) => {
        if (key.includes("lesson_status")) return "not attempted";
        if (key.includes("entry")) return "ab-initio";
        if (key.includes("suspend_data")) return "";
        return "";
      },
      LMSSetValue: () => "true",
      LMSCommit: () => "true",
      LMSGetLastError: () => "0",
      LMSGetErrorString: () => "No error",
      LMSGetDiagnostic: () => "No diagnostic",
    };

    // Mock SCORM 2004 API
    scormWindow.API_1484_11 = {
      Initialize: () => "true",
      Terminate: () => "true",
      GetValue: (key: string) => {
        if (key.includes("completion_status")) return "not attempted";
        if (key.includes("entry")) return "ab-initio";
        if (key.includes("suspend_data")) return "";
        return "";
      },
      SetValue: () => "true",
      Commit: () => "true",
      GetLastError: () => "0",
      GetErrorString: () => "No error",
      GetDiagnostic: () => "No diagnostic",
    };

    // Optional completion trigger
    const timer = setTimeout(() => {
      fetch("/api/mark-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module: "hr-induction",
        }),
      });
    }, 60000);

    return () => {
      clearTimeout(timer);
      window.clearInterval(sessionGuard);
      window.clearInterval(dashboardNavGuard);
    };
  }, [syncDashboardNavigation]);

  return (
    <div className="relative h-screen w-full bg-black">
      <button
        type="button"
        onClick={() => router.push("/learn/hr-induction")}
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/70"
      >
        <span aria-hidden>←</span>
        Back to modules
      </button>
      <iframe
        ref={iframeRef}
        src="/scorm/hr-induction/index_lms.html"
        className="h-full w-full border-none"
        allowFullScreen
        onLoad={syncDashboardNavigation}
      />
    </div>
  );
}
