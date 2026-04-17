"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";
import { parseSessionUser } from "@/app/lib/session";

const onboardingKitItems = [
  { name: "Coffee Mug", icon: "☕" },
  { name: "Water Bottle", icon: "💧" },
  { name: "Customized Diary & Pen", icon: "📓" },
  { name: "Chair Cushion", icon: "🪑" },
  { name: "Leadership Book", icon: "📘" },
  { name: "Trolley Bag", icon: "🧳" },
  { name: "Tech Gear", icon: "💻" },
] as const;

type Mode = "loading" | "select" | "submitted";

export default function OnboardingKitPage() {
  const { ready, sessionUser } = useRequireSession();
  const [mode, setMode] = useState<Mode>("loading");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready || !sessionUser) return;

    const fetchKit = async () => {
      const u = parseSessionUser(
        typeof window !== "undefined" ? localStorage.getItem("user") : null
      );
      if (!u?.mobile) {
        setMode("select");
        return;
      }
      try {
        const res = await fetch("/api/get-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: u.mobile }),
        });
        const data = await res.json();
        const kit: string[] = data?.user?.onboardingKit || [];
        if (kit.length > 0) {
          setSelected(new Set(kit));
          setMode("submitted");
        } else {
          setMode("select");
        }
      } catch {
        setMode("select");
      }
    };

    void fetchKit();
  }, [ready, sessionUser]);

  if (!ready || !sessionUser || mode === "loading") {
    return <SessionLoading />;
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      toast.error("Please select at least one item.");
      return;
    }

    const u = parseSessionUser(
      typeof window !== "undefined" ? localStorage.getItem("user") : null
    );
    if (!u?.mobile) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/update-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: u.mobile,
          selectedItems: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Could not save your selections.");
        return;
      }
      toast.success("Onboarding kit saved! We'll have it ready for Day 1.");
      setMode("submitted");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => setMode("select");

  const selectedItems = onboardingKitItems.filter((item) => selected.has(item.name));

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Onboarding Kit"
            subtitle="Choose the items you'd like to receive on Day 1."
            titleEmoji="🎁"
          />

          <AnimatePresence mode="wait">
            {/* Selection mode */}
            {mode === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Your Onboarding Kit 🎁
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                  A premium kit curated for your leadership journey at NPCI
                </p>

                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {onboardingKitItems.map((item) => {
                    const isSelected = selected.has(item.name);
                    return (
                      <motion.button
                        key={item.name}
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          toggle(item.name);
                          toast(`${item.name} will be included in your kit`);
                        }}
                        className={[
                          "relative bg-white rounded-xl p-4 shadow-sm flex flex-col items-center justify-center border transition",
                          isSelected
                            ? "border-indigo-200 ring-2 ring-indigo-100"
                            : "border-gray-100 hover:border-gray-200",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <span className="absolute right-2 top-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                            Included
                          </span>
                        )}
                        <span className="text-2xl mb-2" aria-hidden>
                          {item.icon}
                        </span>
                        <span className="text-xs text-gray-700 text-center">
                          {item.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {selected.size}
                    </span>{" "}
                    item{selected.size !== 1 ? "s" : ""} selected
                  </p>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={saving}
                    onClick={handleSubmit}
                    className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Submit selection"}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Submitted / view mode */}
            {mode === "submitted" && (
              <motion.div
                key="submitted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Kit confirmed
                    </p>
                    <p className="text-xs text-emerald-700">
                      Your selections have been saved. We'll prepare your kit
                      for Day 1.
                    </p>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Your Onboarding Kit 🎁
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  A premium kit curated for your leadership journey at NPCI
                </p>

                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {onboardingKitItems.map((item) => {
                    const isSelected = selected.has(item.name);
                    return (
                      <div
                        key={item.name}
                        className={[
                          "relative bg-white rounded-xl p-4 shadow-sm flex flex-col items-center justify-center border",
                          isSelected ? "border-indigo-200" : "border-gray-100 opacity-70",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <span className="absolute right-2 top-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                            Included
                          </span>
                        )}
                        <span className="text-2xl mb-2" aria-hidden>
                          {item.icon}
                        </span>
                        <span className="text-xs text-gray-700 text-center">
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEdit}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    Edit selection
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
