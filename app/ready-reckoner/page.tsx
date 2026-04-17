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
    hrbp: { name: "Edna Delesseps", contact: "NA", email: "NA" },
    it:   { name: "NA",             contact: "NA", email: "NA" },
    admin:{ name: "NA",             contact: "NA", email: "NA" },
  },
  Chennai: {
    hrbp: { name: "Sarika Subramani", contact: "NA", email: "NA" },
    it:   { name: "NA",               contact: "NA", email: "NA" },
    admin:{ name: "NA",               contact: "NA", email: "NA" },
  },
  Hyderabad: {
    hrbp: { name: "Aditya Dixit", contact: "NA", email: "NA" },
    it:   { name: "NA",           contact: "NA", email: "NA" },
    admin:{ name: "NA",           contact: "NA", email: "NA" },
  },
};

const locations: Location[] = ["Mumbai", "Chennai", "Hyderabad"];

type SpocCardProps = { label: string; person: PersonEntry };

function NaChip() {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-400">
      NA
    </span>
  );
}

function SpocCard({ label, person }: SpocCardProps) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mb-2 text-sm font-semibold text-slate-800">
        {person.name === "NA" ? <NaChip /> : person.name}
      </p>
      <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span aria-hidden>📞</span>
          <span className="font-medium">Contact:</span>
          {person.contact === "NA" ? <NaChip /> : <span className="font-semibold text-slate-700">{person.contact}</span>}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span aria-hidden>✉️</span>
          <span className="font-medium">Email:</span>
          {person.email === "NA" ? <NaChip /> : <span className="font-semibold text-slate-700">{person.email}</span>}
        </span>
      </div>
    </div>
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
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Ready Reckoner"
            subtitle="Find key SPOCs based on your location."
            titleEmoji="📘"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-gray-300 hover:text-slate-900"
            >
              <span className="text-base" aria-hidden>←</span>
              Dashboard
            </button>

            {/* Location selector */}
            <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">
                Select your location
              </h2>
              <div className="flex flex-wrap gap-2">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={[
                      "rounded-xl border px-5 py-2.5 text-sm font-semibold transition",
                      location === loc
                        ? "border-primary/40 bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-indigo-200/40"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                    ].join(" ")}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </section>

            {/* SPOC detail card */}
            <motion.section
              key={location}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef0ff] text-xl">
                  📍
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    {location} SPOCs
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your key contacts for Day 1 onboarding
                  </p>
                </div>
              </div>

              <div>
                <SpocCard label="HRBP" person={spoc.hrbp} />
                <SpocCard label="IT SPOC" person={spoc.it} />
                <SpocCard label="Admin" person={spoc.admin} />
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
