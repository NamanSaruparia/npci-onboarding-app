/**
 * One-off migration: normalize every User.mobile to 10 digits (last 10 of digits-only).
 * Matches app "cleanMobile" style used in APIs after trim (10-digit storage).
 *
 * Run from project root:
 *   npx tsx scripts/fixMobiles.ts
 *
 * Requires MONGODB_URI (set in shell or in .env.local — this script loads .env.local if unset).
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";
import User from "../app/models/User";

function ensureMongoUri(): string {
  const fromEnv = process.env.MONGODB_URI?.trim();
  if (fromEnv) return fromEnv;

  const p = resolve(process.cwd(), ".env.local");
  if (existsSync(p)) {
    const text = readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const m = t.match(/^MONGODB_URI\s*=\s*(.*)$/);
      if (m) {
        let v = m[1].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        process.env.MONGODB_URI = v;
        return v;
      }
    }
  }

  throw new Error(
    "MONGODB_URI not set. Export it or define MONGODB_URI in .env.local"
  );
}

function toCleanMobile(raw: string): string {
  return String(raw).replace(/\D/g, "").slice(-10);
}

async function fixMobiles() {
  const uri = ensureMongoUri();
  await mongoose.connect(uri, { dbName: "npci-app" });

  const users = await User.find({});

  for (const user of users) {
    if (!user.mobile) continue;

    const cleanMobile = toCleanMobile(user.mobile);
    if (!/^\d{10}$/.test(cleanMobile)) {
      console.warn(`Skip (invalid after normalize): _id=${user._id} mobile=${user.mobile}`);
      continue;
    }

    if (user.mobile === cleanMobile) continue;

    const conflict = await User.findOne({
      mobile: cleanMobile,
      _id: { $ne: user._id },
    });
    if (conflict) {
      console.error(
        `Skip duplicate target: ${user.mobile} → ${cleanMobile} (taken by _id=${conflict._id})`
      );
      continue;
    }

    console.log(`Fixing: ${user.mobile} → ${cleanMobile}`);
    user.mobile = cleanMobile;
    await user.save();
  }

  await mongoose.disconnect();
  console.log("All users normalized (where possible)");
  process.exit(0);
}

fixMobiles().catch((err) => {
  console.error(err);
  process.exit(1);
});
