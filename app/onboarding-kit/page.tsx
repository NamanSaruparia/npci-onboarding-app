"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";
import { parseSessionUser } from "@/app/lib/session";

const onboardingKitItems = [
  { name: "Coffee Mug", icon: "☕", desc: "NPCI-branded ceramic mug" },
  { name: "Water Bottle", icon: "🧴", desc: "Pure copper bottle" },
  { name: "Customized Diary & Pen", icon: "📓", desc: "Customized diary with pen" },
  {
    name: "Leadership Book",
    icon: "📘",
    desc: "Curated for new leaders",
    bookTitle: "Hard Things About Hard Things",
  },
  { name: "Backpack", icon: "🎒", desc: "Premium laptop backpack" },
  { name: "Bluetooth Speaker", icon: "🔊", desc: "Compact portable speaker" },
] as const;

const rupayCardVariants = [
  { id: "card_a", label: "Card Option A", gradient: "from-slate-700 to-slate-900" },
  { id: "card_b", label: "Card Option B", gradient: "from-indigo-600 to-violet-700" },
  { id: "card_c", label: "Card Option C", gradient: "from-rose-500 to-pink-700" },
  { id: "card_d", label: "Card Option D", gradient: "from-amber-500 to-orange-600" },
  { id: "already_have", label: "Already have RuPay card", gradient: "from-slate-500 to-slate-700" },
];

type Mode = "loading" | "select" | "submitted";

export default function OnboardingKitPage() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();
  const [mode, setMode] = useState<Mode>("loading");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [selectedCardVariant, setSelectedCardVariant] = useState<string>("");
  const [bankName, setBankName] = useState("");

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
        const kitDetails = data?.user?.onboardingKitDetails;
        setSelectedCardVariant(String(kitDetails?.selectedCardVariant ?? ""));
        setBankName(String(kitDetails?.bankName ?? ""));
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
    if (!selectedCardVariant) {
      toast.error("Please select a RuPay card design.");
      return;
    }
    if (selectedCardVariant !== "already_have" && !bankName.trim()) {
      toast.error("Please enter your bank name for the RuPay card.");
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
          selectedCardVariant,
          bankName,
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

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-[24px] p-4 sm:p-6">
          <PageHeader
            title="Onboarding Kit"
            subtitle="Choose the items you'd like to receive on Day 1."
            titleEmoji="🎁"
          />

          {/* Hero banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 overflow-hidden rounded-[22px] bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 px-6 py-6 shadow-lg"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-200 mb-1">
              Exclusively for you
            </p>
            <h2 className="text-xl font-bold text-white mb-1">
              Your NPCI Welcome Kit
            </h2>
            <p className="text-sm text-indigo-100">
              A premium collection curated for your leadership journey.
            </p>
          </motion.div>

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
                <p className="mb-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Select items to include
                </p>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {onboardingKitItems.map((item, i) => {
                    const isSelected = selected.has(item.name);
                    return (
                      <motion.button
                        key={item.name}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          toggle(item.name);
                          if (!isSelected) toast(`${item.name} added to your kit`);
                        }}
                        className={[
                          "relative flex flex-col items-center gap-2 rounded-2xl border p-5 text-center shadow-sm transition-all duration-200",
                          isSelected
                            ? "border-indigo-300 bg-gradient-to-b from-indigo-50 to-white ring-2 ring-indigo-100 shadow-indigo-100/60 shadow-md"
                            : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white shadow">
                            ✓
                          </span>
                        )}
                        <span
                          className={[
                            "flex h-14 w-14 items-center justify-center rounded-full text-3xl shadow-sm",
                            isSelected ? "bg-indigo-100" : "bg-slate-50",
                          ].join(" ")}
                          aria-hidden
                        >
                          {item.icon}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 leading-tight">
                          {item.name}
                        </span>
                        {"bookTitle" in item && item.bookTitle ? (
                          <span className="text-[10px] font-medium text-slate-500 leading-snug">
                            {item.bookTitle}
                          </span>
                        ) : null}
                        <span className="text-[10px] text-slate-400 leading-snug">
                          {item.desc}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* RuPay Credit Card */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-6 overflow-hidden rounded-2xl border-2 border-indigo-200 bg-white shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xl shadow-sm">
                        💳
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">RuPay Credit Card</p>
                        <p className="text-[11px] text-slate-400">Issued on Day 1</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-5 space-y-5">
                    {/* Card variant picker */}
                    <div>
                      <p className="mb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Choose your card option
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {rupayCardVariants.map((variant) => {
                          const isChosen = selectedCardVariant === variant.id;
                          return (
                            <motion.button
                              key={variant.id}
                              type="button"
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setSelectedCardVariant(variant.id)}
                              className={[
                                "relative flex flex-col items-center gap-2.5 rounded-xl border p-3 text-center transition-all duration-200",
                                isChosen
                                  ? "border-indigo-400 ring-2 ring-indigo-100 shadow-md"
                                  : "border-slate-200 hover:border-indigo-200 hover:shadow-sm",
                              ].join(" ")}
                            >
                              {isChosen && (
                                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] text-white shadow">
                                  ✓
                                </span>
                              )}
                              {/* Mini card preview */}
                              <div
                                className={[
                                  "w-full rounded-lg bg-gradient-to-br px-3 py-2.5 shadow-sm",
                                  variant.gradient,
                                ].join(" ")}
                              >
                                <div className="flex items-start justify-between">
                                  <span className="text-[8px] font-semibold tracking-widest text-white/70 uppercase">RuPay</span>
                                  <span className="text-[10px] text-white/80">💳</span>
                                </div>
                                <div className="mt-2 flex gap-0.5">
                                  {[0,1,2,3].map((n) => (
                                    <span key={n} className="text-[6px] tracking-wider text-white/60">••••</span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-[10px] font-medium text-slate-600 leading-tight">
                                {variant.label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bank name input */}
                    {selectedCardVariant !== "already_have" && (
                      <div>
                        <label
                          htmlFor="bank-name"
                          className="mb-1.5 block text-xs font-medium text-slate-500 uppercase tracking-wide"
                        >
                          Your bank name
                        </label>
                        <input
                          id="bank-name"
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. State Bank of India"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>

                <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-5 py-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {selected.size} item{selected.size !== 1 ? "s" : ""} selected
                    </p>
                    <p className="text-xs text-slate-400">Ready for Day 1 delivery</p>
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={saving}
                    onClick={handleSubmit}
                    className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-600 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Confirm kit"}
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
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl shadow-sm">
                    ✅
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Kit confirmed</p>
                    <p className="text-xs text-emerald-600">
                      We&apos;ll have everything ready and waiting for you on Day 1.
                    </p>
                  </div>
                </div>

                <p className="mb-4 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Your selections
                </p>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {onboardingKitItems.map((item, i) => {
                    const isSelected = selected.has(item.name);
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className={[
                          "relative flex flex-col items-center gap-2 rounded-2xl border p-5 text-center shadow-sm transition-all",
                          isSelected
                            ? "border-indigo-200 bg-gradient-to-b from-indigo-50 to-white shadow-md shadow-indigo-100/50"
                            : "border-slate-100 bg-white opacity-40",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white shadow">
                            ✓
                          </span>
                        )}
                        <span
                          className={[
                            "flex h-14 w-14 items-center justify-center rounded-full text-3xl shadow-sm",
                            isSelected ? "bg-indigo-100" : "bg-slate-50",
                          ].join(" ")}
                          aria-hidden
                        >
                          {item.icon}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 leading-tight">
                          {item.name}
                        </span>
                        {"bookTitle" in item && item.bookTitle ? (
                          <span className="text-[10px] font-medium text-slate-500 leading-snug">
                            {item.bookTitle}
                          </span>
                        ) : null}
                        <span className="text-[10px] text-slate-400 leading-snug">
                          {item.desc}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* RuPay summary in submitted view */}
                {(selectedCardVariant || bankName) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 overflow-hidden rounded-2xl border-2 border-indigo-200 bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-5 py-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xl shadow-sm">
                        💳
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">RuPay Credit Card</p>
                        <p className="text-[11px] text-slate-400">Included in your onboarding kit</p>
                      </div>
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white shadow">
                        ✓
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 px-5 py-4">
                      {selectedCardVariant && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">Design</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {rupayCardVariants.find((v) => v.id === selectedCardVariant)?.label ?? selectedCardVariant}
                          </p>
                        </div>
                      )}
                      {bankName && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">Bank</p>
                          <p className="text-sm font-semibold text-slate-700">{bankName}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEdit}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    Edit selection
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <span aria-hidden>←</span> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
