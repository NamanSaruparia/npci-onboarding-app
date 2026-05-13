"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type NotificationCategory = "activity" | "milestone" | "badge" | "doj" | "time";

export type Notification = {
  id: string;
  message: string;
  time: string; // ISO string
  read: boolean;
  category: NotificationCategory;
  eventKey?: string; // deduplication key for triggerEvent
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (message: string, category?: NotificationCategory) => void;
  triggerEvent: (eventKey: string, message: string, category?: NotificationCategory) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  initForUser: (mobile: string) => void;
};

// ── Storage helpers ────────────────────────────────────────────────────────

function storageKey(mobile: string) {
  return `npci_notifications_${mobile}`;
}

function firedKey(mobile: string) {
  return `npci_fired_events_${mobile}`;
}

function getMobileFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw) as { mobile?: string };
    return String(u?.mobile || "").trim() || null;
  } catch {
    return null;
  }
}

function loadNotifications(mobile: string): Notification[] {
  try {
    const raw = localStorage.getItem(storageKey(mobile));
    return raw ? (JSON.parse(raw) as Notification[]) : [];
  } catch {
    return [];
  }
}

function persist(mobile: string, notifications: Notification[]) {
  try {
    localStorage.setItem(storageKey(mobile), JSON.stringify(notifications));
  } catch { /* quota or SSR */ }
}

function hasFired(mobile: string, eventKey: string): boolean {
  try {
    const raw = localStorage.getItem(firedKey(mobile));
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    return list.includes(eventKey);
  } catch {
    return false;
  }
}

function markFired(mobile: string, eventKey: string) {
  try {
    const raw = localStorage.getItem(firedKey(mobile));
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(eventKey)) {
      list.push(eventKey);
      localStorage.setItem(firedKey(mobile), JSON.stringify(list));
    }
  } catch { /* ignore */ }
}

function makeNotif(
  message: string,
  category: NotificationCategory,
  eventKey?: string
): Notification {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    time: new Date().toISOString(),
    read: false,
    category,
    ...(eventKey ? { eventKey } : {}),
  };
}

// ── Context ────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentMobile, setCurrentMobile] = useState<string | null>(null);

  // Load user's persisted notifications (called after login / on dashboard mount)
  const initForUser = useCallback(
    (mobile: string) => {
      if (!mobile || mobile === currentMobile) return;
      setCurrentMobile(mobile);
      setNotifications(loadNotifications(mobile));
    },
    [currentMobile]
  );

  // Fire a notification every time it's called (e.g. uploads, login)
  const addNotification = useCallback(
    (message: string, category: NotificationCategory = "activity") => {
      const mobile = currentMobile ?? getMobileFromStorage();
      const notif = makeNotif(message, category);

      setNotifications((prev) => {
        // If context wasn't initialized, load existing from storage first
        const base = !currentMobile && mobile ? loadNotifications(mobile) : prev;
        const next = [notif, ...base];
        if (mobile) {
          if (!currentMobile) setCurrentMobile(mobile);
          persist(mobile, next);
        }
        return next;
      });
    },
    [currentMobile]
  );

  // Fire a notification exactly ONCE per eventKey per user (deduplication in localStorage)
  const triggerEvent = useCallback(
    (
      eventKey: string,
      message: string,
      category: NotificationCategory = "activity"
    ) => {
      const mobile = currentMobile ?? getMobileFromStorage();
      if (!mobile) return;
      if (hasFired(mobile, eventKey)) return;

      markFired(mobile, eventKey);
      const notif = makeNotif(message, category, eventKey);

      setNotifications((prev) => {
        const base = !currentMobile && mobile ? loadNotifications(mobile) : prev;
        const next = [notif, ...base];
        if (!currentMobile) setCurrentMobile(mobile);
        persist(mobile, next);
        return next;
      });
    },
    [currentMobile]
  );

  const markAllRead = useCallback(() => {
    const mobile = currentMobile ?? getMobileFromStorage();
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      if (mobile) persist(mobile, next);
      return next;
    });
  }, [currentMobile]);

  const markRead = useCallback(
    (id: string) => {
      const mobile = currentMobile ?? getMobileFromStorage();
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        if (mobile) persist(mobile, next);
        return next;
      });
    },
    [currentMobile]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        triggerEvent,
        markAllRead,
        markRead,
        initForUser,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
