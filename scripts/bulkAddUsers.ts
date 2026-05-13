/**
 * Bulk-add users from NPCI_Employee_Data.xlsx into MongoDB.
 *
 * Run with:  npx tsx scripts/bulkAddUsers.ts
 *
 * Fields applied uniformly:
 *   position / role  → "Head"
 *   employeeType     → "lateral"
 *   band             → "B2"
 *   dayOfJoining     → 2026-05-15
 *   location         → "Mumbai"   (required field — update if needed)
 *   reportingManager → "TBD"      (required field — update per user after import)
 */

import * as readline from "readline";
import * as XLSX from "xlsx";
import mongoose from "mongoose";

async function main() {
  // ── load env ──────────────────────────────────────────────────────────────
  const fromEnv = process.env.MONGODB_URI?.trim();
  let MONGODB_URI = fromEnv || "";

  if (!MONGODB_URI) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    MONGODB_URI = await new Promise<string>((resolve) =>
      rl.question("MongoDB URI: ", (v) => { rl.close(); resolve(v.trim()); })
    );
  }
  if (!MONGODB_URI) { console.error("No MONGODB_URI supplied."); process.exit(1); }

  // ── user schema (minimal) ────────────────────────────────────────────────
  const UserSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
  const User = mongoose.models["User"] ?? mongoose.model("User", UserSchema);

  // ── read Excel ────────────────────────────────────────────────────────────
  const wb = XLSX.readFile("C:/Users/Npci onboarding/Downloads/NPCI_Employee_Data.xlsx");
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];

  const ALLOWED_ENTITIES = ["NPCI", "NBBL", "NIPL", "NBSL"];

  const users = rows
    .slice(1)  // skip header row
    .filter((row) => row[2])
    .map((row) => {
      const entity = ALLOWED_ENTITIES.includes(String(row[0] ?? "").trim())
        ? String(row[0]).trim()
        : "NPCI";
      const name   = String(row[1] ?? "").trim();
      // Handle "XXXX / YYYY" dual-number cells — take first 10-digit number
      const mobile = String(row[2] ?? "").split("/")[0].trim().replace(/\D/g, "");
      return { entity, name, mobile };
    })
    .filter((u) => u.mobile.length === 10);

  // ── connect & upsert ──────────────────────────────────────────────────────
  await mongoose.connect(MONGODB_URI, { dbName: "npci-db" });
  console.log(`Connected. Importing ${users.length} users…\n`);

  const DOJ = new Date("2026-05-15T00:00:00.000Z");
  let added = 0, updated = 0, skipped = 0;

  for (const u of users) {
    try {
      const result = await User.findOneAndUpdate(
        { mobile: u.mobile },
        {
          $set: {
            mobile:           u.mobile,
            name:             u.name,
            position:         "Head",
            role:             "Head",
            entity:           u.entity,
            employeeType:     "lateral",
            band:             "B2",
            dayOfJoining:     DOJ,
            location:         "Mumbai",
            reportingManager: "TBD",
            isAllowed:        true,
          },
          $setOnInsert: {
            isVerified:      false,
            uploadedDocs:    0,
            profileImageUrl: "",
          },
        },
        { upsert: true, new: true, includeResultMetadata: true }
      );

      if (result?.lastErrorObject?.updatedExisting) {
        console.log(`  ↺  Updated : ${u.name} (${u.mobile}) [${u.entity}]`);
        updated++;
      } else {
        console.log(`  ✓  Added   : ${u.name} (${u.mobile}) [${u.entity}]`);
        added++;
      }
    } catch (err) {
      console.error(`  ✗  Failed  : ${u.name} (${u.mobile}) —`, (err as Error).message);
      skipped++;
    }
  }

  await mongoose.disconnect();
  console.log(`\nDone.  Added: ${added}  |  Updated: ${updated}  |  Failed: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
