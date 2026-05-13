const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  convertInchesToTwip,
  PageBreak,
  UnderlineType,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Colour palette ─────────────────────────────────────────────────────────
const INDIGO   = "4F46E5";
const INDIGO_L = "EEF2FF";
const SLATE    = "334155";
const SLATE_L  = "F8FAFC";
const EMERALD  = "059669";
const AMBER    = "D97706";
const WHITE    = "FFFFFF";

// ── Helpers ────────────────────────────────────────────────────────────────
function h(text, level = HeadingLevel.HEADING_1, color = INDIGO) {
  return new Paragraph({
    heading: level,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        color,
        size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22,
        font: "Calibri",
      }),
    ],
  });
}

function p(text, { bold = false, color = SLATE, size = 22, spacing = 120, indent = 0 } = {}) {
  return new Paragraph({
    spacing: { after: spacing },
    indent: indent ? { left: convertInchesToTwip(indent) } : undefined,
    children: [
      new TextRun({ text, bold, color, size, font: "Calibri" }),
    ],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80 },
    indent: { left: convertInchesToTwip(0.25 + level * 0.25) },
    children: [
      new TextRun({ text, size: 22, color: SLATE, font: "Calibri" }),
    ],
  });
}

function labelValue(label, value) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: label + ": ", bold: true, size: 22, color: INDIGO, font: "Calibri" }),
      new TextRun({ text: value, size: 22, color: SLATE, font: "Calibri" }),
    ],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" } },
    children: [],
  });
}

function banner(text) {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    shading: { type: ShadingType.SOLID, color: INDIGO_L },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text, bold: true, size: 24, color: INDIGO, font: "Calibri" }),
    ],
  });
}

function tableRow(cols, isHeader = false) {
  return new TableRow({
    tableHeader: isHeader,
    children: cols.map((col, i) =>
      new TableCell({
        shading: isHeader ? { type: ShadingType.SOLID, color: INDIGO } : i % 2 === 0 ? { type: ShadingType.SOLID, color: SLATE_L } : undefined,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: String(col),
                bold: isHeader,
                color: isHeader ? WHITE : SLATE,
                size: 20,
                font: "Calibri",
              }),
            ],
          }),
        ],
      })
    ),
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      left:   { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      right:  { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideH:{ style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
      insideV:{ style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
    },
    rows: [
      tableRow(headers, true),
      ...rows.map((r) => tableRow(r)),
    ],
  });
}

// ══════════════════════════════════════════════════════════════════════════
// DOCUMENT
// ══════════════════════════════════════════════════════════════════════════
const doc = new Document({
  creator: "NPCI Onboarding App",
  title: "Navigator – Notifications & Progress Tracker Logic",
  description: "Manager briefing document",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22, color: SLATE },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left:   convertInchesToTwip(1.1),
            right:  convertInchesToTwip(1.1),
          },
        },
      },
      children: [

        // ── Cover ──────────────────────────────────────────────────────
        new Paragraph({ spacing: { after: 400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: "NPCI", bold: true, size: 56, color: INDIGO, font: "Calibri" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "Navigator — Onboarding App", bold: true, size: 36, color: SLATE, font: "Calibri" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [
            new TextRun({ text: "Notifications & Progress Tracker — Logic Briefing", size: 28, color: "94A3B8", font: "Calibri" }),
          ],
        }),
        divider(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "Prepared for: ", bold: true, size: 22, color: SLATE, font: "Calibri" }),
            new TextRun({ text: "HR / Management Review", size: 22, color: SLATE, font: "Calibri" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
          children: [
            new TextRun({ text: "Date: May 2026", size: 22, color: "94A3B8", font: "Calibri" }),
          ],
        }),

        // ── Page break ─────────────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // SECTION 1 — Overview
        // ══════════════════════════════════════════════════════════════
        h("1. Overview", HeadingLevel.HEADING_1),
        p(
          "The Navigator app guides every new NPCI employee through their onboarding journey " +
          "from the day they accept the offer to their 30th day. Two core systems work together " +
          "to keep them on track:",
          { spacing: 160 }
        ),
        bullet("Progress Tracker — shows how far along each person is in their onboarding journey."),
        bullet("Notification System — sends timely, relevant alerts tied to real actions taken by the employee."),
        p(""),

        divider(),

        // ══════════════════════════════════════════════════════════════
        // SECTION 2 — Journey Phases
        // ══════════════════════════════════════════════════════════════
        h("2. The Four Journey Phases", HeadingLevel.HEADING_1),
        p(
          "The onboarding journey is split into four named phases, each appearing as a " +
          "quadrant on the employee's dashboard:",
          { spacing: 160 }
        ),

        makeTable(
          ["#", "Phase Name", "What it covers"],
          [
            ["1", "Welcome Aboard", "Pre-joining tasks — onboarding kit, profile, and NPCI deep dive videos."],
            ["2", "First Impressions", "Day 1 activities — HR induction modules and the ready reckoner."],
            ["3", "Find your Rhythm", "30-day journey — 15-day check-in, goal alignment, mini assignment, and feedback survey."],
            ["4", "Wall of Milestones", "Badge collection — rewards for completing each phase."],
          ]
        ),
        p(""),

        divider(),

        // ══════════════════════════════════════════════════════════════
        // SECTION 3 — Progress Tracker
        // ══════════════════════════════════════════════════════════════
        h("3. Progress Tracker", HeadingLevel.HEADING_1),
        p(
          "There are two progress rings shown on every employee's dashboard. Both update " +
          "automatically based on what the employee has actually completed — not just visited.",
          { spacing: 160 }
        ),

        h("3.1  Welcome Aboard Ring (left ring)", HeadingLevel.HEADING_2),
        p("Tracks completion of the two mandatory pre-joining steps:", { spacing: 80 }),
        bullet("Onboarding Kit — submitted when the employee confirms their kit selections."),
        bullet("Your Profile — submitted when the employee saves their personal answers."),
        p("Formula: completed items ÷ 2 × 100%  (max 100%)", { bold: true, color: EMERALD, spacing: 160 }),

        h("3.2  Overall Journey Ring (right ring)", HeadingLevel.HEADING_2),
        p("Tracks all 7 key milestones across the entire onboarding journey:", { spacing: 80 }),
        bullet("Onboarding Kit submitted"),
        bullet("Your Profile saved"),
        bullet("All 4 Induction modules opened"),
        bullet("Goal Alignment link opened"),
        bullet("Mini Assignment submitted"),
        bullet("15-Day Check-In submitted"),
        bullet("30-Day Onboarding Feedback Survey submitted"),
        p("Formula: completed items ÷ 7 × 100%  (max 100%)", { bold: true, color: EMERALD, spacing: 160 }),

        h("3.3  Key Rule: Submit to Count", HeadingLevel.HEADING_2),
        p(
          "Simply visiting a page does NOT update the tracker. Progress only moves forward " +
          "when the employee takes a deliberate action:",
          { spacing: 80 }
        ),

        makeTable(
          ["Activity", "What triggers progress"],
          [
            ["Onboarding Kit", "Employee clicks 'Confirm kit' button"],
            ["Your Profile", "Employee clicks 'Save answers' button"],
            ["Induction", "Employee opens all 4 modules (Culture Playbook, NPCI Way, Employee Benefits, Performance Management)"],
            ["Goal Alignment", "Employee clicks 'Open Goal Alignment →' to access the external goal-setting tool"],
            ["Mini Assignment", "Employee clicks 'Submit' after writing their answer"],
            ["15-Day Check-In", "Employee clicks 'Submit' after rating all questions"],
            ["Feedback Survey", "Employee clicks 'Submit' after rating all questions"],
          ]
        ),
        p(""),

        h("3.4  Items NOT counted in progress", HeadingLevel.HEADING_2),
        p("The following tiles appear on the dashboard for reference but do NOT affect the progress rings:", { spacing: 80 }),
        bullet("Ready Reckoner — reference page for SPOC contacts, informational only."),
        bullet("NPCI Deep Dive — links to videos for exploration, not a graded milestone."),
        p(""),

        divider(),

        // ══════════════════════════════════════════════════════════════
        // SECTION 4 — Badges
        // ══════════════════════════════════════════════════════════════
        h("4. Badges (Wall of Milestones)", HeadingLevel.HEADING_1),
        p(
          "Four badges can be earned. Each badge unlocks automatically when the corresponding " +
          "phase milestone is reached. They are one-time awards — once earned, they stay permanently.",
          { spacing: 160 }
        ),

        makeTable(
          ["Badge", "Emoji", "Unlocks when…"],
          [
            ["Explorer",      "🏅", "Welcome Aboard ring hits 100% (both kit and profile submitted)"],
            ["Collaborator",  "🤝", "All 4 induction modules have been opened"],
            ["Achiever",      "🎖️", "15-Day Check-In has been submitted"],
            ["Navigator",     "🥇", "30-Day Feedback Survey has been submitted"],
          ]
        ),
        p(""),

        divider(),

        // Page break before notifications section
        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // SECTION 5 — Notification System
        // ══════════════════════════════════════════════════════════════
        h("5. Notification System", HeadingLevel.HEADING_1),
        p(
          "Every notification in Navigator is event-driven — they only appear because something " +
          "real happened. There are no generic or filler messages. Notifications are saved per " +
          "employee and persist even after closing and reopening the app.",
          { spacing: 160 }
        ),

        h("5.1  How it works", HeadingLevel.HEADING_2),
        bullet("Each employee has their own notification history, stored privately on their device."),
        bullet("Notifications appear in the 🔔 bell icon at the top of the dashboard."),
        bullet("A red dot on the bell means there are unread notifications."),
        bullet("Clicking a notification marks it as read. 'Clear all' marks all as read."),
        bullet("One-time notifications (badges, milestones) can never appear twice — they are deduplicated automatically."),
        bullet("Repeat notifications (e.g. each document upload) fire every time the action occurs."),
        p(""),

        h("5.2  Full list of notifications by category", HeadingLevel.HEADING_2),

        banner("Category 1 — Activity (triggered by employee actions)"),
        p(""),
        makeTable(
          ["Trigger", "Notification message", "Fires"],
          [
            ["Employee logs in",               "Welcome back, [Name]! Ready to continue your journey.",          "Every login"],
            ["Onboarding Kit submitted",        "✅ Onboarding kit confirmed — your selections have been saved.", "Once"],
            ["Your Profile saved",              "👤 Your profile has been saved.",                               "Once"],
            ["Document uploaded",               "📄 Document uploaded and pending HR review.",                   "Every upload"],
            ["All 4 induction modules opened",  "🏛️ You've opened all induction modules.",                     "Once"],
            ["15-Day Check-In submitted",       "📅 15-Day Check-In submitted successfully.",                    "Once"],
            ["Goal Alignment link opened",      "🎯 Goal Alignment opened — submit your draft on time.",        "Once"],
            ["Mini Assignment submitted",       "📋 Mini Assignment submitted.",                                 "Once"],
            ["Feedback Survey submitted",       "📝 30-Day Onboarding Feedback Survey submitted.",              "Once"],
          ]
        ),
        p(""),

        banner("Category 2 — Milestones (triggered by progress percentage)"),
        p(""),
        makeTable(
          ["Trigger", "Notification message", "Fires"],
          [
            ["Overall journey hits 25%",  "You're 25% through your onboarding — good start.",   "Once"],
            ["Overall journey hits 50%",  "Halfway through your onboarding journey!",            "Once"],
            ["Overall journey hits 75%",  "75% done — the finish line is in sight.",             "Once"],
            ["Overall journey hits 100%", "🎉 Onboarding complete! You've done it.",             "Once"],
          ]
        ),
        p(""),

        banner("Category 3 — Badges (triggered by badge unlocks)"),
        p(""),
        makeTable(
          ["Trigger", "Notification message", "Fires"],
          [
            ["Explorer badge unlocked",     "🏅 Explorer badge unlocked! Welcome Aboard phase complete.",         "Once"],
            ["Collaborator badge unlocked", "🤝 Collaborator badge unlocked! First Impressions phase complete.",  "Once"],
            ["Achiever badge unlocked",     "🎖️ Achiever badge unlocked! 15-Day Check-In complete.",            "Once"],
            ["Navigator badge unlocked",    "🥇 Navigator badge unlocked! Feedback Survey complete.",             "Once"],
          ]
        ),
        p(""),

        banner("Category 4 — Day-of-Joining (triggered by joining date)"),
        p(""),
        makeTable(
          ["Trigger", "Notification message", "Fires"],
          [
            ["Day of joining is tomorrow", "🗓️ Day 1 is tomorrow — you're all set!", "Once"],
            ["Day of joining is today",    "🎉 Today is your Day 1 at NPCI. Welcome aboard!", "Once"],
          ]
        ),
        p(""),

        banner("Category 5 — Time on App (triggered by total time spent)"),
        p(""),
        makeTable(
          ["Trigger", "Notification message", "Fires"],
          [
            ["Employee has spent 10 mins total on the app", "You've spent 10 minutes exploring the app — keep going.", "Once"],
            ["Employee has spent 30 mins total on the app", "30 minutes in — you're getting a solid onboarding foundation.", "Once"],
          ]
        ),
        p(""),

        divider(),

        // ══════════════════════════════════════════════════════════════
        // SECTION 6 — Summary
        // ══════════════════════════════════════════════════════════════
        h("6. Summary", HeadingLevel.HEADING_1),
        p(
          "In simple terms, the Navigator app tracks the employee's onboarding journey in real time. " +
          "Every action the employee takes — submitting a form, opening a module, completing a survey — " +
          "moves the progress rings forward and may trigger a relevant notification. " +
          "Nothing is hardcoded or generic. Everything the employee sees in their notification bell " +
          "reflects something they actually did.",
          { spacing: 160 }
        ),

        makeTable(
          ["Principle", "How it works in Navigator"],
          [
            ["No fake progress",        "Visiting a page doesn't count. Only submits and completions do."],
            ["No generic messages",     "Every notification is tied to a specific event in the employee's journey."],
            ["Persistent history",      "Notifications survive page refresh and reopening — stored per employee."],
            ["No duplicate alerts",     "One-time notifications (badges, milestones) are deduplicated — fire once, remembered forever."],
            ["Time awareness",          "The app tracks how long each employee has spent on it and rewards engagement."],
            ["Joining date awareness",  "Countdown notifications fire automatically based on the DOJ set by HR in the admin panel."],
          ]
        ),
        p(""),
        p(
          "The HR admin panel controls the joining date for each employee. " +
          "Once set, the DOJ-based notifications (Day 1 tomorrow, Day 1 today) fire automatically " +
          "without any manual action required.",
          { spacing: 80, color: "64748B" }
        ),

        divider(),
        p(""),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [
            new TextRun({ text: "NPCI Navigator · Onboarding System · Confidential", size: 18, color: "94A3B8", font: "Calibri" }),
          ],
        }),
      ],
    },
  ],
});

// ── Write file ─────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, "..", "NPCI_Navigator_Notifications_Tracker_Logic.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log("✅  Document written to:", outPath);
});
