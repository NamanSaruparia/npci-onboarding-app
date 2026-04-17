"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { parseSessionUser } from "@/app/lib/session";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { useNotifications } from "../context/NotificationContext";

type Step = "mobile" | "otp";

function normalizeMobile(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export default function Login() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const session = parseSessionUser(localStorage.getItem("user"));
    if (session?.mobile) {
      router.replace("/dashboard");
      return;
    }
    setAuthChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const handleSendOtp = async () => {
    const normalized = normalizeMobile(mobile);
    if (!/^\d{10}$/.test(normalized)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
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
        toast.success("OTP sent. Check your registered mobile.");
      } else {
        const message = data?.message || "Unable to send OTP.";
        setErrorMessage(message);
        toast.error(message);
      }
    } catch {
      toast.error("Network error. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error("Enter a valid 6-digit OTP.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: normalizeMobile(mobile), otp: otp.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        const userRes = await fetch("/api/get-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: normalizeMobile(mobile) }),
        });
        const userData = await userRes.json();

        if (!userRes.ok || !userData?.user) {
          const message = userData?.message || "Unable to load user profile.";
          setErrorMessage(message);
          toast.error(message);
          return;
        }

        const role =
          String(userData.user.role || userData.user.position || "").trim();

        const mobileStored = String(
          userData.user.mobile ?? normalizeMobile(mobile)
        ).trim();

        localStorage.setItem(
          "user",
          JSON.stringify({
            mobile: mobileStored,
            name: userData.user.name || "",
            role,
            isAllowed: Boolean(userData.user.isAllowed),
            isVerified: Boolean(userData.user.isVerified),
          })
        );

        toast.success("OTP verified successfully.");
        addNotification("Welcome to NPCI Navigators! 👋 Login successful.");
        router.replace("/welcome");
      } else {
        const message = data?.message || "OTP verification failed.";
        setErrorMessage(message);
        toast.error(message);
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
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Login"
            subtitle="Secure sign-in with mobile OTP."
            titleEmoji="🔐"
            showProfile={false}
          />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
          >
          <div className="space-y-5">
            {step === "mobile" && (
              <div className="space-y-2">
                <label
                  htmlFor="mobile"
                  className="text-sm font-medium text-slate-700"
                >
                  Mobile number
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#eaf4ff] text-lg">
                    📱
                  </span>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(normalizeMobile(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary/45"
                  />
                </div>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-2">
                <label
                  htmlFor="otp"
                  className="text-sm font-medium text-slate-700"
                >
                  OTP verification
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#eef0ff] text-lg">
                    🔢
                  </span>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleVerifyOtp();
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-3 text-sm tracking-[0.25em] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary/45"
                  />
                </div>
              </div>
            )}

            {errorMessage ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {errorMessage}
              </p>
            ) : null}

            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              disabled={submitting}
              onClick={() => {
                if (step === "mobile") {
                  void handleSendOtp();
                } else {
                  void handleVerifyOtp();
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? (
                "Please wait…"
              ) : (
                <>
                  {step === "mobile" ? "Send OTP" : "Verify OTP"}
                  <span aria-hidden>→</span>
                </>
              )}
            </motion.button>

            {step === "otp" ? (
              <button
                type="button"
                onClick={() => void handleSendOtp()}
                disabled={submitting}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-center text-xs font-medium text-slate-600 transition hover:border-gray-300 disabled:opacity-60"
              >
                Resend OTP
              </button>
            ) : null}

          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
            By continuing you agree to use this portal for official onboarding
            purposes only.
          </p>
          </motion.div>

          <p className="mt-8 text-center text-sm text-slate-500">
            <Link
              href="/"
              className="font-medium text-primary underline-offset-4 transition hover:text-primary/85 hover:underline"
            >
              Back
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
