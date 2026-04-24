/**
 * One-off script: set profileImageUrl for a user by name (case-insensitive partial match).
 *
 * Run from project root:
 *   npx tsx scripts/setProfileImage.ts
 *
 * Requires MONGODB_URI (set in shell or in .env.local).
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

async function setProfileImage() {
  const uri = ensureMongoUri();
  await mongoose.connect(uri, { dbName: "npci-db" });

  const nameFilter = "Rohini";
  const imageUrl = "/images/rohini.png";

  const result = await User.updateMany(
    { name: { $regex: nameFilter, $options: "i" } },
    { $set: { profileImageUrl: imageUrl } }
  );

  if (result.matchedCount === 0) {
    console.warn(`No users found matching name "${nameFilter}".`);
  } else {
    console.log(
      `Updated ${result.modifiedCount} / ${result.matchedCount} user(s) named "${nameFilter}" → profileImageUrl set to "${imageUrl}".`
    );
  }

  await mongoose.disconnect();
  process.exit(0);
}

setProfileImage().catch((err) => {
  console.error(err);
  process.exit(1);
});
