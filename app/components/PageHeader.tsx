"use client";

import { useEffect, useState } from "react";
import { parseSessionUser } from "@/app/lib/session";
import { useNotifications } from "@/app/context/NotificationContext";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  titleEmoji?: string;
  showProfile?: boolean;
};

export function PageHeader({ title, subtitle, titleEmoji = "✨", showProfile = true }: PageHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [profile, setProfile] = useState({
    name: "Anu Ramakrishnan",
    position: "Head Transformation Planning & Design, HR CoE",
    profileImageUrl: "/dashboard-profile.png",
  });

  const { notifications, unreadCount, markAllRead } = useNotifications();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = parseSessionUser(localStorage.getItem("user"));
    if (!parsed?.mobile) return;

    setProfile({
      name: parsed.name || parsed.mobile || "Anu Ramakrishnan",
      position:
        String(parsed.role || parsed.position || "").trim() ||
        "Head Transformation Planning & Design, HR CoE",
      profileImageUrl: parsed.profileImageUrl || "/dashboard-profile.png",
    });
  }, []);

  return (
    <section className="mb-6 rounded-[24px] border border-slate-200 bg-white shadow-sm">
      {showProfile && (
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={profile.profileImageUrl}
              alt="Profile"
              className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-200"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {profile.name}
              </p>
              <p className="truncate text-xs text-slate-500">
                {profile.position}
              </p>
            </div>
          </div>

          <div className="relative shrink-0">
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
                <div className="fixed left-1/2 top-[4.5rem] z-50 w-[min(calc(100vw-2.5rem),22rem)] max-h-[min(70vh,22rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:translate-x-0">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700">Notifications</h2>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs font-medium text-primary transition hover:text-primary/70"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">No notifications yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {notifications.map((n) => (
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
                  )}
                </div>
              </>
            )}
          </div>
        </header>
      )}

      <div className="px-6 py-5">
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef0ff] text-xl">
          {titleEmoji}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </section>
  );
}
