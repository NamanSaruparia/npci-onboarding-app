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
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Colour palette ──────────────────────────────────────────────────────────
const INDIGO   = "4F46E5";
const INDIGO_L = "EEF2FF";
const SLATE    = "334155";
const SLATE_L  = "F8FAFC";
const EMERALD  = "059669";
const AMBER    = "D97706";
const ROSE     = "E11D48";
const WHITE    = "FFFFFF";
const GRAY     = "64748B";

// ── Helpers ─────────────────────────────────────────────────────────────────
function h(text, level = HeadingLevel.HEADING_1, color = INDIGO) {
  const sizes = {
    [HeadingLevel.HEADING_1]: 34,
    [HeadingLevel.HEADING_2]: 27,
    [HeadingLevel.HEADING_3]: 23,
  };
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 130 },
    children: [new TextRun({ text, bold: true, color, size: sizes[level] ?? 24, font: "Calibri" })],
  });
}

function p(text, { bold = false, color = SLATE, size = 22, spacing = 130, italic = false } = {}) {
  return new Paragraph({
    spacing: { after: spacing },
    children: [new TextRun({ text, bold, color, size, italic, font: "Calibri" })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 90 },
    indent: { left: convertInchesToTwip(0.3 + level * 0.25) },
    children: [new TextRun({ text, size: 22, color: SLATE, font: "Calibri" })],
  });
}

function note(text) {
  return new Paragraph({
    spacing: { before: 80, after: 160 },
    shading: { type: ShadingType.SOLID, color: "FFF7ED" },
    children: [
      new TextRun({ text: "📌  Note: ", bold: true, size: 20, color: AMBER, font: "Calibri" }),
      new TextRun({ text, size: 20, color: "92400E", font: "Calibri" }),
    ],
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 180, after: 180 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" } },
    children: [],
  });
}

function banner(text, color = INDIGO, bgColor = INDIGO_L) {
  return new Paragraph({
    spacing: { before: 220, after: 140 },
    shading: { type: ShadingType.SOLID, color: bgColor },
    children: [new TextRun({ text: "  " + text, bold: true, size: 23, color, font: "Calibri" })],
  });
}

function makeTable(headers, rows, colWidths) {
  const totalCols = headers.length;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:     { style: BorderStyle.SINGLE, size: 4,  color: "E2E8F0" },
      bottom:  { style: BorderStyle.SINGLE, size: 4,  color: "E2E8F0" },
      left:    { style: BorderStyle.SINGLE, size: 4,  color: "E2E8F0" },
      right:   { style: BorderStyle.SINGLE, size: 4,  color: "E2E8F0" },
      insideH: { style: BorderStyle.SINGLE, size: 2,  color: "E2E8F0" },
      insideV: { style: BorderStyle.SINGLE, size: 2,  color: "E2E8F0" },
    },
    rows: [
      // header row
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: INDIGO },
            width: colWidths ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
            margins: { top: 100, bottom: 100, left: 130, right: 130 },
            children: [new Paragraph({
              children: [new TextRun({ text: String(h), bold: true, color: WHITE, size: 20, font: "Calibri" })],
            })],
          })
        ),
      }),
      // data rows
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) =>
            new TableCell({
              shading: ri % 2 === 0 ? { type: ShadingType.SOLID, color: SLATE_L } : undefined,
              width: colWidths ? { size: colWidths[ci], type: WidthType.PERCENTAGE } : undefined,
              margins: { top: 90, bottom: 90, left: 130, right: 130 },
              children: [new Paragraph({
                children: [new TextRun({ text: String(cell), size: 20, color: SLATE, font: "Calibri" })],
              })],
            })
          ),
        })
      ),
    ],
  });
}

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  creator: "NPCI Onboarding App",
  title: "Navigator – Notifications & Progress Tracker Logic (Updated)",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22, color: SLATE } } },
  },
  sections: [{
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

      // ── Cover ──────────────────────────────────────────────────────────────
      new Paragraph({ spacing: { after: 500 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "NPCI", bold: true, size: 60, color: INDIGO, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "Navigator — Onboarding App", bold: true, size: 36, color: SLATE, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: "Notifications & Progress Tracker", size: 28, color: GRAY, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 500 },
        children: [new TextRun({ text: "Logic Briefing for Management  |  May 2026", size: 22, color: "94A3B8", italic: true, font: "Calibri" })],
      }),
      divider(),
      new Paragraph({ spacing: { after: 600 }, children: [] }),

      // ── Page break ─────────────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      // 1. OVERVIEW
      // ══════════════════════════════════════════════════════════════════════
      h("1.  Overview"),
      p(
        "The Navigator app guides every new NPCI employee through their onboarding journey " +
        "from offer acceptance to their 30th day. Two core systems keep employees on track:"
      ),
      bullet("Progress Tracker — two visual rings showing how far along each person is."),
      bullet("Notification System — timely alerts tied exclusively to real actions taken by the employee."),
      p(""),
      note(
        "Neither system is generic. Everything shown is based on what the specific employee has actually done."
      ),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 2. THE FOUR PHASES
      // ══════════════════════════════════════════════════════════════════════
      h("2.  The Four Journey Phases"),
      p("The onboarding journey is divided into four phases, each displayed as a quadrant on the employee's dashboard:"),
      p(""),
      makeTable(
        ["#", "Phase Name", "What it covers"],
        [
          ["1", "Welcome Aboard",    "Pre-joining tasks — onboarding kit, your profile, and NPCI deep dive videos."],
          ["2", "First Impressions", "Day 1 activities — HR induction modules and the ready reckoner."],
          ["3", "Find your Rhythm",  "30-day journey — 15-day check-in, goal alignment, mini assignment, and feedback survey."],
          ["4", "Wall of Milestones","Badge collection — rewards earned for completing each phase."],
        ],
        [8, 22, 70]
      ),
      p(""),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 3. PROGRESS TRACKER
      // ══════════════════════════════════════════════════════════════════════
      h("3.  Progress Tracker"),
      p(
        "Two circular progress rings appear on every employee's dashboard. Both update " +
        "automatically — but only when the employee takes a deliberate action, never just for visiting a page."
      ),
      p(""),

      // 3.1
      h("3.1  Welcome Aboard Ring  (left ring)", HeadingLevel.HEADING_2),
      p("Tracks the two mandatory pre-joining steps:"),
      bullet("Onboarding Kit — submitted when the employee clicks 'Confirm kit'."),
      bullet("Your Profile — submitted when the employee clicks 'Save answers'."),
      p("Formula:  Items completed  ÷  2  ×  100%", { bold: true, color: EMERALD }),
      p(""),

      // 3.2
      h("3.2  Overall Journey Ring  (right ring)", HeadingLevel.HEADING_2),
      p("Tracks all 7 key milestones across the full onboarding journey:"),
      bullet("Onboarding Kit submitted"),
      bullet("Your Profile saved"),
      bullet("Induction — both available modules opened (Culture Playbook + NPCI Way)"),
      bullet("Goal Alignment tile clicked on the dashboard"),
      bullet("Mini Assignment submitted"),
      bullet("15-Day Check-In submitted"),
      bullet("30-Day Onboarding Feedback Survey submitted"),
      p("Formula:  Items completed  ÷  7  ×  100%", { bold: true, color: EMERALD }),
      p(""),

      // 3.3
      h("3.3  The 'Submit to Count' Rule", HeadingLevel.HEADING_2),
      p("Simply opening a page does NOT move the tracker. Each milestone requires a specific deliberate action:"),
      p(""),
      makeTable(
        ["Activity", "Exact trigger that counts as complete"],
        [
          ["Onboarding Kit",      "Employee clicks 'Confirm kit' button on the onboarding kit page."],
          ["Your Profile",        "Employee clicks 'Save answers' button on the profile page."],
          ["Induction",           "Employee opens both available modules — Culture Playbook (PDF) and NPCI Way (SCORM). The other two modules (Employee Benefits, Performance Management) are locked for now and do not count."],
          ["Goal Alignment",      "Employee clicks the 'Goal alignment' tile directly from the dashboard. Visiting the page alone does not count."],
          ["Mini Assignment",     "Employee types an answer and clicks 'Submit ✓' on the mini assignment page."],
          ["15-Day Check-In",     "Employee rates all questions and clicks 'Submit' on the check-in page."],
          ["Feedback Survey",     "Employee rates all questions and clicks 'Submit' on the feedback survey page."],
        ],
        [28, 72]
      ),
      p(""),

      // 3.4
      h("3.4  Items NOT counted in the progress rings", HeadingLevel.HEADING_2),
      p("The following tiles appear on the dashboard for reference only and do not affect either ring:"),
      bullet("Ready Reckoner — reference page showing SPOC contacts per location. Informational only."),
      bullet("NPCI Deep Dive — links to NPCI videos for exploration. Not a graded milestone."),
      p(""),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 4. BADGES
      // ══════════════════════════════════════════════════════════════════════
      h("4.  Badges  (Wall of Milestones)"),
      p(
        "Four badges can be earned. Each unlocks automatically when its phase condition is met. " +
        "They are one-time awards — once earned they are permanently visible on the dashboard."
      ),
      p(""),
      makeTable(
        ["Badge", "Unlocks when…"],
        [
          ["🏅  Explorer",     "Welcome Aboard ring hits 100% — both Onboarding Kit and Profile are submitted."],
          ["🤝  Collaborator", "Both available induction modules (Culture Playbook and NPCI Way) have been opened."],
          ["🎖️  Achiever",    "15-Day Check-In has been submitted."],
          ["🥇  Navigator",    "30-Day Onboarding Feedback Survey has been submitted."],
        ],
        [22, 78]
      ),
      p(""),
      divider(),

      // Page break before notifications
      new Paragraph({ children: [new PageBreak()] }),

      // ══════════════════════════════════════════════════════════════════════
      // 5. NOTIFICATION SYSTEM
      // ══════════════════════════════════════════════════════════════════════
      h("5.  Notification System"),
      p(
        "Every notification in Navigator is event-driven — they appear only because something real happened. " +
        "There are no generic filler messages. Each employee's notification history is stored privately and " +
        "persists even after closing and reopening the app."
      ),
      p(""),

      h("5.1  How it works", HeadingLevel.HEADING_2),
      bullet("Notifications appear under the 🔔 bell icon at the top of the dashboard."),
      bullet("A red dot on the bell means there are unread notifications."),
      bullet("Clicking a notification marks it as read. 'Clear all' marks all as read."),
      bullet("Notifications are stored per employee — each person sees only their own history."),
      bullet("History survives page refresh and app restarts — nothing is lost on close."),
      bullet("One-time notifications (badges, milestones) are deduplicated — they fire exactly once per employee, ever."),
      bullet("Repeat notifications (e.g. each document upload) fire every time the action occurs."),
      p(""),

      h("5.2  Complete list of notifications  (21 total)", HeadingLevel.HEADING_2),
      p(""),

      // Category 1
      banner("Category 1 — Activity  (triggered by employee actions)"),
      p(""),
      makeTable(
        ["Trigger", "Notification shown to employee", "Fires"],
        [
          ["Logs in",                             "Welcome back, [Name]! Ready to continue your journey.",          "Every login"],
          ["Onboarding Kit submitted",            "✅ Onboarding kit confirmed — your selections have been saved.", "Once"],
          ["Profile saved",                       "👤 Your profile has been saved.",                               "Once"],
          ["Document uploaded",                   "📄 Document uploaded and pending HR review.",                   "Every upload"],
          ["Both induction modules opened",       "🏛️ You've opened all induction modules.",                     "Once"],
          ["Goal Alignment tile clicked",         "🎯 Goal Alignment opened — submit your draft on time.",        "Once"],
          ["Mini Assignment submitted",           "📋 Mini Assignment submitted.",                                 "Once"],
          ["15-Day Check-In submitted",           "📅 15-Day Check-In submitted successfully.",                    "Once"],
          ["Feedback Survey submitted",           "📝 30-Day Onboarding Feedback Survey submitted.",              "Once"],
        ],
        [35, 48, 17]
      ),
      p(""),

      // Category 2
      banner("Category 2 — Milestones  (triggered by overall progress percentage)"),
      p(""),
      makeTable(
        ["Trigger", "Notification shown to employee", "Fires"],
        [
          ["Overall progress reaches 25%",  "You're 25% through your onboarding — good start.",  "Once"],
          ["Overall progress reaches 50%",  "Halfway through your onboarding journey!",           "Once"],
          ["Overall progress reaches 75%",  "75% done — the finish line is in sight.",            "Once"],
          ["Overall progress reaches 100%", "🎉 Onboarding complete! You've done it.",            "Once"],
        ],
        [35, 48, 17]
      ),
      p(""),

      // Category 3
      banner("Category 3 — Badges  (triggered when a badge is unlocked)"),
      p(""),
      makeTable(
        ["Trigger", "Notification shown to employee", "Fires"],
        [
          ["Explorer badge unlocked",     "🏅 Explorer badge unlocked! Welcome Aboard phase complete.",        "Once"],
          ["Collaborator badge unlocked", "🤝 Collaborator badge unlocked! First Impressions phase complete.", "Once"],
          ["Achiever badge unlocked",     "🎖️ Achiever badge unlocked! 15-Day Check-In complete.",           "Once"],
          ["Navigator badge unlocked",    "🥇 Navigator badge unlocked! Feedback Survey complete.",            "Once"],
        ],
        [30, 53, 17]
      ),
      p(""),

      // Category 4
      banner("Category 4 — Day of Joining  (triggered automatically by joining date set in admin panel)"),
      p(""),
      makeTable(
        ["Trigger", "Notification shown to employee", "Fires"],
        [
          ["Joining date is tomorrow", "🗓️ Day 1 is tomorrow — you're all set!", "Once"],
          ["Joining date is today",    "🎉 Today is your Day 1 at NPCI. Welcome aboard!", "Once"],
        ],
        [30, 53, 17]
      ),
      note("HR must set the employee's date of joining in the admin panel. Once set, these notifications fire automatically with no further action needed."),

      // Category 5
      banner("Category 5 — Time on App  (triggered by total time spent in the app)"),
      p(""),
      makeTable(
        ["Trigger", "Notification shown to employee", "Fires"],
        [
          ["Employee has spent 10 minutes total in the app", "You've spent 10 minutes exploring the app — keep going.", "Once"],
          ["Employee has spent 30 minutes total in the app", "30 minutes in — you're getting a solid onboarding foundation.", "Once"],
        ],
        [42, 41, 17]
      ),
      p(""),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 6. SUMMARY
      // ══════════════════════════════════════════════════════════════════════
      h("6.  Summary for Management"),
      p(
        "In plain terms: every number on the employee's dashboard and every notification " +
        "they receive reflects something they actually did. Nothing is assumed, fabricated, or hardcoded."
      ),
      p(""),
      makeTable(
        ["Design Principle", "How Navigator applies it"],
        [
          ["No fake progress",       "Visiting a page never counts. Only explicit submits and completions advance the rings."],
          ["No generic messages",    "Every notification is tied to one specific action in that employee's journey."],
          ["Persistent history",     "Notifications survive page refresh and app restarts — stored privately per employee."],
          ["No duplicate alerts",    "One-time notifications (badges, milestones, DOJ) are fired exactly once and never repeated."],
          ["Time engagement",        "The app tracks cumulative time spent and rewards continued engagement."],
          ["HR-controlled dates",    "Day-of-joining countdown notifications are driven entirely by what HR sets in the admin panel."],
          ["Locked = not counted",   "Modules or features locked as 'coming soon' are automatically excluded from progress calculations."],
        ],
        [30, 70]
      ),
      p(""),
      p(""),
      divider(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300 },
        children: [new TextRun({ text: "NPCI Navigator  ·  Onboarding System  ·  Confidential  ·  May 2026", size: 18, color: "94A3B8", italic: true, font: "Calibri" })],
      }),
    ],
  }],
});

// ── Write ────────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, "..", "NPCI_Navigator_Notifications_Tracker_Logic.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("✅  Document written to:", outPath);
});
