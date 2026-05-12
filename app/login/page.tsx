"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { parseSessionUser, sessionDestination } from "@/app/lib/session";
import toast from "react-hot-toast";
import { useNotifications } from "../context/NotificationContext";

type Role = "employee" | "admin";
type Step = "role" | "mobile" | "otp";

function normalizeMobile(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

// ── Animated card wrapper ────────────────────────────────────────────────────
function SlideCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Login() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [authChecked, setAuthChecked] = useState(false);
  const [role, setRole] = useState<Role>("employee");
  const [step, setStep] = useState<Step>("role");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Skip login if already logged in
  useEffect(() => {
    const session = parseSessionUser(localStorage.getItem("user"));
    if (session?.mobile) {
      router.replace(sessionDestination());
      return;
    }
    setAuthChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearError = () => setErrorMessage("");

  // ── OTP send ───────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const normalized = normalizeMobile(mobile);
    if (!/^\d{10}$/.test(normalized)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    setSubmitting(true);
    clearError();
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: normalized }),
      });
      const data = await res.json();
      if (res.ok) {
        setMobile(normalized);
        setStep("otp");
        toast.success("OTP sent — use 000000 for demo.");
      } else {
        const msg = data?.message || "Unable to send OTP.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch {
      toast.error("Network error. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── OTP verify ─────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error("Enter a valid 6-digit OTP.");
      return;
    }
    setSubmitting(true);
    clearError();
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: normalizeMobile(mobile), otp: otp.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || "OTP verification failed.";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      // Fetch full user profile
      const userRes = await fetch("/api/get-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: normalizeMobile(mobile) }),
      });
      const userData = await userRes.json();

      if (!userRes.ok || !userData?.user) {
        const msg = userData?.message || "Unable to load user profile.";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      const u = userData.user;
      const isAdmin = role === "admin"; // driven by the pill the user clicked
      localStorage.setItem(
        "user",
        JSON.stringify({
          mobile: String(u.mobile ?? normalizeMobile(mobile)).trim(),
          name: u.name || "",
          role: String(u.role || u.position || "").trim(),
          position: String(u.position || "").trim(),
          location: u.location || "",
          profileImageUrl: u.profileImageUrl || "",
          isAllowed: Boolean(u.isAllowed),
          isVerified: Boolean(u.isVerified),
          isAdmin,
        })
      );

      toast.success("Login successful!");
      addNotification("Welcome to NPCI Navigators! 👋");

      // Route based on the role pill the user selected
      if (isAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/welcome");
      }
    } catch {
      toast.error("Network error. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-white" aria-hidden />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30 px-4 py-10">
      <div className="w-full max-w-md">
        <motion.div
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              NPCI Navigators
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {step === "role" && "Select your login type to continue"}
              {step === "mobile" && (role === "admin" ? "Admin — enter your mobile number" : "Employee — enter your mobile number")}
              {step === "otp" && "Enter the OTP sent to your mobile number"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Step: Role selector ─────────────────────────────────────── */}
            {step === "role" && (
              <SlideCard key="role">
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: "employee", emoji: "👤", label: "Employee", desc: "Onboarding portal" },
                      { id: "admin", emoji: "🛡️", label: "Admin", desc: "Manage users" },
                    ] as { id: Role; emoji: string; label: string; desc: string }[]
                  ).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setRole(r.id);
                        setStep("mobile");
                        setMobile("");
                        setOtp("");
                        clearError();
                      }}
                      className={[
                        "flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 text-center transition-all hover:scale-[1.02]",
                        role === r.id
                          ? "border-primary/50 bg-gradient-to-br from-primary/8 to-secondary/8"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300",
                      ].join(" ")}
                    >
                      <span className="text-3xl">{r.emoji}</span>
                      <span className="text-sm font-semibold text-slate-800">{r.label}</span>
                      <span className="text-[11px] text-slate-400">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </SlideCard>
            )}

            {/* ── Step: Mobile entry ──────────────────────────────────────── */}
            {step === "mobile" && (
              <SlideCard key="mobile">
                <div className="space-y-4">
                  {/* Role badge */}
                  <div className="flex items-center justify-between">
                    <span className={[
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                      role === "admin"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-indigo-100 text-indigo-700",
                    ].join(" ")}>
                      {role === "admin" ? "🛡️ Admin" : "👤 Employee"}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setStep("role"); clearError(); }}
                      className="text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="mobile" className="text-sm font-medium text-slate-700">
                      Mobile number
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg">📱</span>
                      <input
                        id="mobile"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        autoFocus
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        value={mobile}
                        onChange={(e) => { setMobile(normalizeMobile(e.target.value)); clearError(); }}
                        onKeyDown={(e) => { if (e.key === "Enter") void handleSendOtp(); }}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                      {errorMessage}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleSendOtp()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200/50 transition hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Sending…" : <><span>Send OTP</span><span aria-hidden>→</span></>}
                  </button>
                </div>
              </SlideCard>
            )}

            {/* ── Step: OTP entry ─────────────────────────────────────────── */}
            {step === "otp" && (
              <SlideCard key="otp">
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xs text-slate-500">OTP sent to</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">{mobile}</p>
                    <p className="mt-1 text-[11px] text-indigo-500 font-medium">Demo OTP: 000000</p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="otp" className="text-sm font-medium text-slate-700">
                      Enter OTP
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔢</span>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        maxLength={6}
                        placeholder="6-digit OTP"
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); clearError(); }}
                        onKeyDown={(e) => { if (e.key === "Enter") void handleVerifyOtp(); }}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-center text-lg font-bold tracking-[0.3em] text-slate-800 outline-none transition placeholder:text-slate-300 placeholder:tracking-normal focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                      {errorMessage}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleVerifyOtp()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200/50 transition hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Verifying…" : <><span>Verify OTP</span><span aria-hidden>→</span></>}
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => { setStep("mobile"); setOtp(""); clearError(); }}
                      className="text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
                    >
                      ← Change number
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleSendOtp()}
                      className="text-xs text-indigo-500 underline-offset-2 transition hover:text-indigo-700 hover:underline disabled:opacity-60"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              </SlideCard>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          For official onboarding use only · NPCI © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
