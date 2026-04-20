"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { useNotifications } from "../context/NotificationContext";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";
import { parseSessionUser, type SessionUser } from "@/app/lib/session";

const DASHBOARD_TOAST_KEY = "npci-dashboard-summary-shown";

type StageId = "pre" | "day1" | "week" | "integration";
type StageStatus = "locked" | "active" | "completed";
type StageTone = "pre" | "day1" | "week" | "integration";

type MiniCardItem = {
  title: string;
  emoji: string;
  onClick: () => void;
};

export default function Dashboard() {
  const router = useRouter();
  const { ready: sessionReady, sessionUser, replaceSession } = useRequireSession();

  const daysLeft = 5;

  const { uploadedDocs, totalDocs, setUploadedDocs } = useAppContext();
  const { notifications: ctxNotifications, unreadCount, markAllRead } = useNotifications();
  const progress = Math.floor((uploadedDocs / totalDocs) * 100);

  const [welcomeVideoDone, setWelcomeVideoDone] = useState(false);
  const [knowMoreDone, setKnowMoreDone] = useState(false);

  const docTrackPct = progress;
  const preOnboardingProgress = Math.round(
    (docTrackPct + (welcomeVideoDone ? 100 : 0) + (knowMoreDone ? 100 : 0)) / 3
  );

  const [stageStatus, setStageStatus] = useState<
    Record<StageId, StageStatus>
  >({
    pre: "active",
    day1: "locked",
    week: "locked",
    integration: "locked",
  });

  // Temporary UI preview override: keep all quadrants unlocked.
  const uiPreviewLockOverride = true;
  const previewStageStatus: Record<StageId, StageStatus> = {
    pre: "active",
    day1: "active",
    week: "active",
    integration: "active",
  };
  const stageStatusForUi = uiPreviewLockOverride ? previewStageStatus : stageStatus;
  const previewStageTag: Record<StageId, string> = {
    pre: "Active",
    day1: "Next",
    week: "Upcoming",
    integration: "Milestones",
  };

  const stageProgressPct = (id: StageId): number => {
    if (stageStatus[id] === "completed") return 100;
    if (stageStatus[id] === "locked") return 0;
    if (id === "pre") return preOnboardingProgress;
    return 0;
  };

  const overallProgress = Math.round(
    (stageProgressPct("pre") +
      stageProgressPct("day1") +
      stageProgressPct("week") +
      stageProgressPct("integration")) /
      4
  );

  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const uploadedDocsRef = useRef(uploadedDocs);
  uploadedDocsRef.current = uploadedDocs;

  useEffect(() => {
    if (preOnboardingProgress < 100) return;
    setStageStatus((prev) => {
      if (prev.pre !== "completed") {
        return {
          ...prev,
          pre: "completed",
          day1: prev.day1 === "locked" ? "active" : prev.day1,
        };
      }
      return prev;
    });
  }, [preOnboardingProgress]);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 640);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || loading) return;
    if (sessionStorage.getItem(DASHBOARD_TOAST_KEY) === "1") return;

    const id = window.setTimeout(() => {
      if (sessionStorage.getItem(DASHBOARD_TOAST_KEY) === "1") return;
      sessionStorage.setItem(DASHBOARD_TOAST_KEY, "1");
      const count = uploadedDocsRef.current;
      const pending = Math.max(0, totalDocs - count);
      const line =
        pending > 0
          ? `${daysLeft} days to Day 1 · ${pending} document${pending === 1 ? "" : "s"} pending`
          : `${daysLeft} days to Day 1 · paperwork complete`;
      toast(line);
    }, 700);

    return () => window.clearTimeout(id);
  }, [loading, totalDocs, daysLeft]);

  useEffect(() => {
    if (!sessionReady) return;

    const fetchUser = async () => {
      if (typeof window === "undefined") return;
      const u = parseSessionUser(localStorage.getItem("user"));
      if (!u?.mobile) return;

      try {
        const res = await fetch("/api/get-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: u.mobile }),
        });
        const data = await res.json();
        if (data?.user) {
          setUploadedDocs(data.user.uploadedDocs || 0);
          const role =
            String(data.user.role || data.user.position || u.role || u.position || "").trim();

          const merged: SessionUser = {
            ...u,
            name: data.user.name || u.name || "",
            mobile: data.user.mobile || u.mobile,
            role,
            position: data.user.position || u.position || "",
            location: data.user.location || u.location || "",
            profileImageUrl: data.user.profileImageUrl || u.profileImageUrl || "",
            isVerified: data.user.isVerified ?? u.isVerified ?? false,
            isAllowed: data.user.isAllowed ?? u.isAllowed ?? false,
            uploadedDocs: data.user.uploadedDocs || 0,
          };

          replaceSession(merged);
        }
      } catch {
        /* non-blocking */
      }
    };

    void fetchUser();
  }, [sessionReady, setUploadedDocs, replaceSession]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNotifications(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!sessionReady || !sessionUser || loading) {
    return <SessionLoading />;
  }

  const user = sessionUser;
  const userName = user.name || user.mobile || "User";
  const displayName =
    userName.length > 0
      ? userName.charAt(0).toUpperCase() + userName.slice(1)
      : "User";
  const roleLine = String(user.role || user.position || "").trim();
  const displayRole = roleLine || "\u2014";

  const notifications: string[] = [];

  notifications.push(
    `${displayName}, your onboarding workspace is up to date.`
  );

  if (daysLeft > 3) {
    notifications.push(`${daysLeft} days until Day 1 — you are on track.`);
  } else {
    notifications.push(`${daysLeft} days left — close out remaining tasks.`);
  }

  if (uploadedDocs < totalDocs) {
    notifications.push(
      `${totalDocs - uploadedDocs} document${
        totalDocs - uploadedDocs === 1 ? "" : "s"
      } awaiting upload.`
    );
  } else {
    notifications.push("All listed documents are marked complete.");
  }

  if (progress < 50) {
    notifications.push("Early stage — prioritize compliance items first.");
  } else if (progress < 80) {
    notifications.push("Solid momentum — keep learning modules in parallel.");
  } else {
    notifications.push("Final stretch — review submissions before Day 1.");
  }

  notifications.push("New curated sessions are available under Learning.");
  notifications.push("Thank you for shaping India’s digital payments story.");

  const advanceStage = (completed: StageId) => {
    const order: StageId[] = ["pre", "day1", "week", "integration"];
    const idx = order.indexOf(completed);
    if (idx < 0) return;
    const next = order[idx + 1];
    setStageStatus((prev) => {
      const nextStatus: Record<StageId, StageStatus> = { ...prev, [completed]: "completed" };
      if (next) {
        if (prev[next] === "locked") nextStatus[next] = "active";
      }
      return nextStatus;
    });
  };

  const handleStageBegin = (id: StageId) => {
    const st = stageStatus[id];
    if (st === "locked") return;
    if (st === "completed") {
      if (id === "pre") router.push("/documents");
      if (id === "day1") router.push("/timeline");
      if (id === "week") router.push("/videos");
      if (id === "integration") toast("Integration playbook opens here soon.");
      return;
    }
    if (id === "pre") {
      router.push("/documents");
      return;
    }
    if (id === "day1") {
      router.push("/timeline");
      advanceStage("day1");
      return;
    }
    if (id === "week") {
      router.push("/videos");
      advanceStage("week");
      return;
    }
    if (id === "integration") {
      toast("Integration playbook opens here soon.");
      advanceStage("integration");
    }
  };

  const preCards: MiniCardItem[] = [
    {
      title: "Document tracker",
      emoji: "📄",
      onClick: () => router.push("/documents"),
    },
    {
      title: "Welcome message",
      emoji: "💬",
      onClick: () => {
        setWelcomeVideoDone(true);
        router.push("/welcome-message");
      },
    },
    {
      title: "Onboarding kit",
      emoji: "🎁",
      onClick: () => router.push("/onboarding-kit"),
    },
    {
      title: "Profile / know more",
      emoji: "👤",
      onClick: () => {
        setKnowMoreDone(true);
        router.push("/know-more");
      },
    },
    {
      title: "NPCI deep dive",
      emoji: "🔍",
      onClick: () => router.push("/videos?tab=deep-dive"),
    },
  ];

  const day1Cards: MiniCardItem[] = [
    { title: "Buddy connect", emoji: "👥", onClick: () => toast("Coming soon.") },
    { title: "HR induction", emoji: "🏛️", onClick: () => toast("Coming soon.") },
    { title: "Ready reckoner", emoji: "📘", onClick: () => router.push("/ready-reckoner") },
  ];

  const weekCards: MiniCardItem[] = [
    { title: "Check-in", emoji: "📅", onClick: () => router.push("/check-in") },
    { title: "Assignment", emoji: "📋", onClick: () => toast("Coming soon.") },
    { title: "Goal alignment", emoji: "🎯", onClick: () => toast("Coming soon.") },
  ];

  const integrationCards: MiniCardItem[] = [
    { title: "Explorer", emoji: "🛡️", onClick: () => toast("Badge path coming soon.") },
    { title: "Collaborator", emoji: "🏆", onClick: () => toast("Badge path coming soon.") },
    { title: "Achiever", emoji: "🎖️", onClick: () => toast("Badge path coming soon.") },
    { title: "Navigator", emoji: "🥇", onClick: () => toast("Badge path coming soon.") },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-lg px-4 py-6 sm:max-w-4xl sm:px-6 sm:py-8">
        <div className="rounded-[24px] bg-[#f5f7fb] p-4 shadow-sm sm:p-6">

        <section className="mb-4 rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                aria-hidden
                className="h-11 w-11 rounded-full border border-slate-200 bg-white ring-1 ring-slate-200"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {displayName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {displayRole}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Log out"
                onClick={() => {
                  localStorage.removeItem("user");
                  sessionStorage.clear();
                  router.replace("/login");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
                title="Log out"
              >
                <span className="text-xl leading-none" aria-hidden>🚪</span>
              </button>

            <div className="relative">
              <button
                type="button"
                aria-expanded={showNotifications}
                aria-label="Notifications"
                onClick={() => {
                  setShowNotifications((v) => !v);
                  if (!showNotifications) markAllRead();
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                <span className="text-xl leading-none" aria-hidden>🔔</span>
                {unreadCount > 0 && (
                  <span className="pointer-events-none absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default bg-slate-900/10 backdrop-blur-[1px]"
                    aria-label="Close notifications"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="fixed left-1/2 top-[4.5rem] z-50 w-[min(calc(100vw-2.5rem),22rem)] max-h-[min(70vh,24rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:translate-x-0">
                    {/* Dynamic notifications from context */}
                    {ctxNotifications.length > 0 && (
                      <>
                        <div className="mb-3 flex items-center justify-between">
                          <h2 className="text-sm font-semibold text-slate-700">Notifications</h2>
                          <button
                            type="button"
                            onClick={markAllRead}
                            className="text-xs font-medium text-primary transition hover:text-primary/70"
                          >
                            Mark all read
                          </button>
                        </div>
                        <ul className="mb-4 space-y-2">
                          {ctxNotifications.map((n) => (
                            <li
                              key={n.id}
                              className={[
                                "rounded-xl border px-3 py-2.5 text-sm leading-snug transition",
                                n.read
                                  ? "border-slate-100 bg-slate-50 text-slate-500"
                                  : "border-indigo-100 bg-indigo-50 text-slate-700",
                              ].join(" ")}
                            >
                              <p>{n.message}</p>
                              <span className="mt-0.5 block text-[11px] text-slate-400">{n.time}</span>
                            </li>
                          ))}
                        </ul>
                        <hr className="mb-3 border-slate-100" />
                      </>
                    )}

                    {/* Static system updates */}
                    <h2 className="mb-3 text-sm font-semibold text-slate-700">Updates</h2>
                    <ul className="space-y-2">
                      {notifications.map((note, i) => (
                        <li
                          key={i}
                          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm leading-snug text-slate-600 transition hover:bg-slate-100"
                        >
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
            </div>
          </header>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="m-4 mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-purple-50 p-6 shadow-sm sm:m-6 sm:mb-6 sm:p-8"
          >
            <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-2">
                <p className="text-sm font-medium text-slate-500">Welcome, {displayName}</p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Welcome to NPCI Navigators!
                </h1>
                <p className="text-sm text-slate-500">
                  Your journey to impact, innovation and growth begins here.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                  <span className="font-medium">{daysLeft} days left</span>
                  <span className="text-slate-400">until Day 1</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-center">
                <img
                  src="/npci-logo.png"
                  alt="NPCI"
                  className="h-20 w-20 object-contain opacity-95 sm:h-24 sm:w-24"
                />
              </div>
            </div>
          </motion.section>
        </section>

        <section className="mb-6 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 text-base font-semibold text-slate-800">
            Progress
          </h2>
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-end justify-between gap-3">
                <span className="text-sm font-medium text-slate-700">
                  Pre-onboarding
                </span>
                <span className="text-sm tabular-nums text-slate-500">
                  {preOnboardingProgress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={false}
                  animate={{ width: `${preOnboardingProgress}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-indigo-400"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Documentation, welcome message, and know more — weighted equally
                for this preview.
              </p>
            </div>
            <div>
              <div className="mb-2 flex items-end justify-between gap-3">
                <span className="text-sm font-medium text-slate-700">
                  Overall journey
                </span>
                <span className="text-sm tabular-nums text-slate-500">
                  {overallProgress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={false}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-sky-400"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                All four stages combined (UI preview — backend wiring later).
              </p>
            </div>
          </div>
        </section>

        <section className="mb-4">
          <h2 className="mb-4 text-base font-semibold text-slate-800">
            Onboarding stages
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StageQuadrant
              title="1. Pre-Onboarding"
              status={stageStatusForUi.pre}
              tone="pre"
              iconEmoji="📄"
              description="Complete essentials before Day 1."
              onBegin={() => handleStageBegin("pre")}
              cards={preCards}
              previewTag={uiPreviewLockOverride ? previewStageTag.pre : undefined}
            />
            <StageQuadrant
              title="2. Day 1 Onboarding"
              status={stageStatusForUi.day1}
              tone="day1"
              iconEmoji="👥"
              description="Navigate your first day conversations."
              onBegin={() => handleStageBegin("day1")}
              cards={day1Cards}
              previewTag={uiPreviewLockOverride ? previewStageTag.day1 : undefined}
            />
            <StageQuadrant
              title="3. First 15 Days"
              status={stageStatusForUi.week}
              tone="week"
              iconEmoji="📅"
              description="Build momentum with early outcomes."
              onBegin={() => handleStageBegin("week")}
              cards={weekCards}
              previewTag={uiPreviewLockOverride ? previewStageTag.week : undefined}
            />
            <StageQuadrant
              title="4. Earn Badges / Integration"
              status={stageStatusForUi.integration}
              tone="integration"
              iconEmoji="🏆"
              description="Progress milestones and deeper integration."
              onBegin={() => handleStageBegin("integration")}
              cards={integrationCards}
              previewTag={uiPreviewLockOverride ? previewStageTag.integration : undefined}
            />
          </div>
        </section>

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-indigo-500 shadow-sm"
          onClick={() =>
            toast("Your onboarding concierge — ask HR for live assistance.")
          }
          aria-label="Open onboarding help"
        >
          <span className="text-2xl leading-none" aria-hidden>
            💬
          </span>
        </motion.button>
        </div>
      </div>
    </div>
  );
}

function StageQuadrant({
  title,
  status,
  tone,
  iconEmoji,
  description,
  onBegin,
  cards,
  previewTag,
}: {
  title: string;
  status: StageStatus;
  tone: StageTone;
  iconEmoji: string;
  description: string;
  onBegin: () => void;
  cards: MiniCardItem[];
  previewTag?: string;
}) {
  const locked = status === "locked";
  const completed = status === "completed";
  const active = status === "active";
  const toneMap: Record<StageTone, string> = {
    pre: "border-[#dfe3ff] bg-[#eef0ff]",
    day1: "border-[#d7e9ff] bg-[#eaf4ff]",
    week: "border-[#d9ecdf] bg-[#edf7f1]",
    integration: "border-[#fde4bf] bg-[#fff4e5]",
  };
  const headerToneMap: Record<StageTone, string> = {
    pre: "bg-[#e0e4ff]",
    day1: "bg-[#dcedff]",
    week: "bg-[#e1f0e6]",
    integration: "bg-[#fbe6c8]",
  };
  const iconToneMap: Record<StageTone, string> = {
    pre: "bg-[#7c83f7] text-white border-transparent",
    day1: "bg-[#4d92f7] text-white border-transparent",
    week: "bg-[#45a86f] text-white border-transparent",
    integration: "bg-[#d99a2b] text-white border-transparent",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "relative flex h-full flex-col overflow-hidden rounded-[22px] border p-5 shadow-sm sm:p-6",
        toneMap[tone],
        locked
          ? "pointer-events-none opacity-[0.56]"
          : completed
            ? "ring-1 ring-emerald-200/80"
            : "ring-1 ring-slate-200/80",
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 h-12",
          headerToneMap[tone],
        ].join(" ")}
        aria-hidden
      />

      {locked && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[22px] bg-white/35 backdrop-blur-sm"
          aria-hidden
        >
          <span className="text-4xl leading-none text-slate-600/70" aria-hidden>
            🔒
          </span>
        </div>
      )}

      <div className="relative z-10 flex min-h-[16rem] flex-1 flex-col">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={[
                "flex h-10 w-10 items-center justify-center rounded-full border text-2xl",
                iconToneMap[tone],
              ].join(" ")}
            >
              <span aria-hidden>{iconEmoji}</span>
            </span>
            <h3 className="text-base font-semibold tracking-tight text-slate-800">
              {title}
            </h3>
          </div>
          <span
            className={
              previewTag
                ? "shrink-0 rounded-full border border-slate-200 bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-600"
                : locked
                  ? "shrink-0 rounded-full border border-slate-200 bg-white/70 px-2.5 py-0.5 text-[10px] font-medium text-slate-500"
                  : active
                    ? "shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-medium text-indigo-600"
                    : "shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600"
            }
          >
            {previewTag ?? (locked ? "Locked" : completed ? "Done" : "Active")}
          </span>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          {description}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2.5">
          {cards.map((card) => (
            <MiniStageCard
              key={card.title}
              title={card.title}
              emoji={card.emoji}
              disabled={locked}
              onClick={card.onClick}
            />
          ))}
        </div>

        <div className="mt-auto border-t border-slate-200/80 pt-4">
          <motion.button
            type="button"
            whileHover={locked ? undefined : { scale: 1.01 }}
            whileTap={locked ? undefined : { scale: 0.99 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            disabled={locked}
            onClick={onBegin}
            className={[
              "w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              locked
                ? "cursor-not-allowed border border-slate-200 bg-white/70 text-slate-400"
                : completed
                  ? "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  : "border border-indigo-200 bg-indigo-500 text-white hover:bg-indigo-600",
            ].join(" ")}
          >
            {locked ? "Locked" : completed ? "Review" : "Begin"}
          </motion.button>
        </div>
      </div>

      {completed && (
        <span
          className="pointer-events-none absolute right-4 top-12 text-2xl leading-none sm:top-14"
          aria-hidden
        >
          ✅
        </span>
      )}
    </motion.article>
  );
}

function MiniStageCard({
  title,
  emoji,
  disabled,
  onClick,
}: {
  title: string;
  emoji: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { scale: 1.03, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      disabled={disabled}
      onClick={onClick}
      className={[
        "group relative flex min-h-[6.6rem] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-slate-100 bg-white p-4 text-center shadow-sm",
        disabled ? "cursor-not-allowed opacity-75" : "hover:shadow-md",
      ].join(" ")}
    >
      <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl leading-none">
        <span aria-hidden>{emoji}</span>
      </span>

      <span className="relative z-10 text-xs font-medium leading-tight text-slate-700">
        {title}
      </span>
    </motion.button>
  );
}
