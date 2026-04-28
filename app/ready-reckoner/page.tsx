"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";

type Location = "Mumbai" | "Chennai" | "Hyderabad";

type PersonEntry = {
  name: string;
  contact: string;
  email: string;
};

type SpocEntry = {
  hrbp: PersonEntry;
  it: PersonEntry;
  admin: PersonEntry;
};

const spocData: Record<Location, SpocEntry> = {
  Mumbai: {
    hrbp:  { name: "Edna Delesseps",  contact: "8108108641", email: "edna.delesseps@npci.org.in" },
    it:    { name: "Sagar Padwal",     contact: "9869239856", email: "sagar.padwal@npci.org.in" },
    admin: { name: "Vishnu Desai",     contact: "9920024855", email: "vishnu.desai@npci.org.in" },
  },
  Chennai: {
    hrbp:  { name: "Sarika Subramani", contact: "9886704222", email: "sarika.subramani@npci.org.in" },
    it:    { name: "Srinivasan Kannan", contact: "9710591232", email: "srinivasan.kannan@npci.org.in" },
    admin: { name: "Aravind Sekar",    contact: "9600005380", email: "aravind.sekar@npci.org.in" },
  },
  Hyderabad: {
    hrbp:  { name: "Aditya Dixit",       contact: "8125155124", email: "aditya.dixit@npci.org.in" },
    it:    { name: "Radhakrishna Akella", contact: "8978899957", email: "radhakrishna.akella@npci.org.in" },
    admin: { name: "Deepak Sharma",      contact: "7799066880", email: "deepak.sharma@npci.org.in" },
  },
};

const locations: Location[] = ["Mumbai", "Chennai", "Hyderabad"];

type SpocCardProps = { label: string; icon: string; accent: string; person: PersonEntry };

const SPOC_META: Record<string, { icon: string; accent: string }> = {
  HRBP:     { icon: "🧑‍💼", accent: "from-indigo-50 to-violet-50 border-indigo-100" },
  "IT SPOC":{ icon: "💻",   accent: "from-sky-50 to-cyan-50 border-sky-100" },
  Admin:    { icon: "🏢",   accent: "from-amber-50 to-orange-50 border-amber-100" },
};

function NaChip() {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
      Not available
    </span>
  );
}

function SpocCard({ label, icon, accent, person }: SpocCardProps) {
  const isNA = person.name === "NA";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col gap-3 rounded-2xl border bg-gradient-to-br p-5 ${accent}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
          {icon}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-sm font-bold text-slate-800">
            {isNA ? <NaChip /> : person.name}
          </p>
        </div>
      </div>
      {!isNA && (
        <div className="flex flex-col gap-2 rounded-xl bg-white/70 px-4 py-3 backdrop-blur-sm">
          <a
            href={`tel:${person.contact}`}
            className="flex items-center gap-2 text-xs text-slate-600 transition hover:text-indigo-600"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-sm">📞</span>
            <span className="font-semibold tracking-wide">{person.contact}</span>
          </a>
          <a
            href={`mailto:${person.email}`}
            className="flex items-center gap-2 text-xs text-slate-600 transition hover:text-indigo-600"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-sm">✉️</span>
            <span className="font-semibold">{person.email}</span>
          </a>
        </div>
      )}
    </motion.div>
  );
}

export default function ReadyReckoner() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();
  const [location, setLocation] = useState<Location>("Mumbai");

  if (!ready || !sessionUser) {
    return <SessionLoading />;
  }

  const spoc = spocData[location];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-[24px] p-4 sm:p-6">
          <PageHeader
            title="Ready Reckoner"
            subtitle="Find key SPOCs based on your location."
            titleEmoji="📘"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              <span aria-hidden>←</span> Dashboard
            </button>

            {/* Hero banner */}
            <div className="overflow-hidden rounded-[22px] bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 px-6 py-5 shadow-lg">
              <p className="text-xs font-medium uppercase tracking-widest text-indigo-200 mb-1">
                Your contacts
              </p>
              <h2 className="text-lg font-bold text-white mb-1">Key SPOCs</h2>
              <p className="text-sm text-indigo-100">
                Reach out to your HRBP, IT, or Admin SPOC for any Day 1 support.
              </p>
            </div>

            {/* Location selector */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Select your location
              </p>
              <div className="flex flex-wrap gap-2">
                {locations.map((loc) => (
                  <motion.button
                    key={loc}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLocation(loc)}
                    className={[
                      "rounded-xl border px-5 py-2.5 text-sm font-semibold transition",
                      location === loc
                        ? "border-indigo-300 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200/50"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:shadow-sm",
                    ].join(" ")}
                  >
                    {loc}
                  </motion.button>
                ))}
              </div>
            </section>

            {/* SPOC cards */}
            <motion.section
              key={location}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-base shadow-sm">
                  📍
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{location} SPOCs</p>
                  <p className="text-xs text-slate-400">Your key contacts for Day 1 onboarding</p>
                </div>
              </div>

              <div className="grid gap-3">
                {(["HRBP", "IT SPOC", "Admin"] as const).map((role) => {
                  const personKey = role === "HRBP" ? "hrbp" : role === "IT SPOC" ? "it" : "admin";
                  const meta = SPOC_META[role];
                  return (
                    <SpocCard
                      key={role}
                      label={role}
                      icon={meta.icon}
                      accent={meta.accent}
                      person={spoc[personKey]}
                    />
                  );
                })}
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
