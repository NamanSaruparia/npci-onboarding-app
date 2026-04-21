"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type AdminUser = {
  _id?: string;
  id?: string;
  name?: string;
  mobile: string;
  position?: string;
  reportingManager?: string;
  location?: string;
  employeeType?: "fresher" | "lateral";
  entity?: "NPCI" | "NBBL" | "NIPL" | "NBSL";
  band?: "B1" | "B2";
  profileImageUrl?: string;
  isAllowed: boolean;
  isVerified: boolean;
  isAdmin?: boolean;
  uploadedDocs: number;
  documents?: {
    docId?: string;
    fileId?: string;
    name: string;
    fileUrl?: string;
    status: "pending" | "approved" | "rejected";
    uploadedAt?: string;
  }[];
  buddyAnswers?: { questionId: string; answer: string }[];
  checkInAnswers?: {
    q1: number;
    q2: number;
    q3: number;
    q4: string;
    submittedAt?: string;
  } | null;
  onboardingKit?: string[];
};

const CHECKIN_SCALE: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😞", label: "Very Poor" },
  2: { emoji: "😕", label: "Poor" },
  3: { emoji: "😐", label: "Average" },
  4: { emoji: "🙂", label: "Good" },
  5: { emoji: "😄", label: "Excellent" },
};

const CHECKIN_QUESTIONS: Record<string, string> = {
  q1: "How has your overall onboarding experience been till now?",
  q2: "Have your initial expectations been met?",
  q3: "How helpful has your buddy been in your onboarding journey?",
  q4: "What has been the most positive part about your journey?",
};

const KIT_ITEMS: { name: string; icon: string }[] = [
  { name: "Coffee Mug",           icon: "☕" },
  { name: "Water Bottle",         icon: "💧" },
  { name: "Customized Diary & Pen", icon: "📓" },
  { name: "Chair Cushion",        icon: "🪑" },
  { name: "Leadership Book",      icon: "📘" },
  { name: "Trolley Bag",          icon: "🧳" },
  { name: "Tech Gear",            icon: "💻" },
];

const KIT_ICON: Record<string, string> = Object.fromEntries(
  KIT_ITEMS.map((i) => [i.name, i.icon])
);

const BUDDY_QUESTIONS: Record<string, string> = {
  passion_work: "What are you most passionate about in life and work?",
  colleagues_three_words:
    "If your friends or colleagues had to describe you in three words, what would they say?",
  skills_growth:
    "What are some skills you're excited to learn or improve going forward?",
  buddy_support: "How can your buddy best support you during onboarding?",
};

const BUDDY_EMOJIS: Record<string, string> = {
  passion_work: "🔥",
  colleagues_three_words: "💬",
  skills_growth: "📈",
  buddy_support: "🌟",
};

function normalizeMobile(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export default function AdminPage() {
  const locations = ["Hyderabad", "Mumbai", "Chennai"] as const;
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [position, setPosition] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [location, setLocation] = useState<(typeof locations)[number]>("Hyderabad");
  const [employeeType, setEmployeeType] = useState<"" | "fresher" | "lateral">("");
  const [entity, setEntity] = useState<"" | "NPCI" | "NBBL" | "NIPL" | "NBSL">("");
  const [band, setBand] = useState<"" | "B1" | "B2">("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [busyMobile, setBusyMobile] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<"docs" | "buddy" | "checkin" | "kit">("docs");

  const totalUsers = useMemo(() => users.length, [users.length]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/get-users", { method: "GET" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Unable to fetch users.");
        return;
      }
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch {
      toast.error("Network error while loading users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeMobile(mobile);
    if (!/^\d{10}$/.test(normalized)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!editingUser && !name.trim()) {
      toast.error("Enter user name.");
      return;
    }
    if (!editingUser && !position.trim()) {
      toast.error("Enter position.");
      return;
    }
    if (!editingUser && !reportingManager.trim()) {
      toast.error("Enter reporting manager.");
      return;
    }
    if (!employeeType) {
      toast.error("Select employee type.");
      return;
    }
    if (!entity) {
      toast.error("Select entity.");
      return;
    }
    if (!band) {
      toast.error("Select band level.");
      return;
    }

    let profileImageUrl = "";
    if (profileImageFile) {
      profileImageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(profileImageFile);
      }).catch(() => {
        toast.error("Failed to read profile image.");
        return "";
      });
    }

    setSubmitting(true);
    try {
      const url = editingUser ? "/api/admin/update-user" : "/api/admin/add-user";
      const payload = editingUser
        ? {
            mobile: normalized,
            employeeType,
            entity,
            band,
          }
        : {
            name: name.trim(),
            mobile: normalized,
            position: position.trim(),
            reportingManager: reportingManager.trim(),
            location,
            employeeType,
            entity,
            band,
            profileImageUrl,
          };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || (editingUser ? "Unable to update user." : "Unable to add user."));
        return;
      }

      setName("");
      setMobile("");
      setPosition("");
      setReportingManager("");
      setLocation("Hyderabad");
      setEmployeeType("");
      setEntity("");
      setBand("");
      setProfileImageFile(null);
      setEditingUser(null);
      toast.success(editingUser ? "User updated successfully." : "User added and allowed for onboarding.");
      await fetchUsers();
    } catch {
      toast.error("Network error while adding user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setName(user.name || "");
    setMobile(user.mobile || "");
    setPosition(user.position || "");
    setReportingManager(user.reportingManager || "");
    setLocation(
      (user.location as (typeof locations)[number]) || "Hyderabad"
    );
    setEmployeeType(user.employeeType || "fresher");
    setEntity(user.entity || "NPCI");
    setBand(user.band || "B1");
  };

  const handleToggle = async (targetMobile: string) => {
    setBusyMobile(targetMobile);
    try {
      const res = await fetch("/api/admin/toggle-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: targetMobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Unable to update access.");
        return;
      }
      toast.success(data?.user?.isAllowed ? "User allowed." : "User blocked.");
      await fetchUsers();
    } catch {
      toast.error("Network error while toggling access.");
    } finally {
      setBusyMobile(null);
    }
  };

  const handleDelete = async (targetMobile: string) => {
    setBusyMobile(targetMobile);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: targetMobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Unable to delete user.");
        return;
      }
      toast.success("User deleted.");
      await fetchUsers();
    } catch {
      toast.error("Network error while deleting user.");
    } finally {
      setBusyMobile(null);
    }
  };

  const handleDocStatus = async (
    mobileNo: string,
    docId: string,
    status: "approved" | "rejected"
  ) => {
    setBusyMobile(mobileNo);
    try {
      const res = await fetch("/api/admin/update-doc-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobileNo, docId, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Unable to update document status.");
        return;
      }
      toast.success(
        status === "approved" ? "Document approved" : "Document rejected"
      );
      await fetchUsers();
    } catch {
      toast.error("Network error while updating document status.");
    } finally {
      setBusyMobile(null);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-border bg-surface/85 p-5 backdrop-blur-md sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                Admin panel
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Onboarding user management
              </h1>
              <p className="mt-2 text-sm text-muted">
                Add approved users, toggle onboarding access, and monitor
                verification/progress.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background/70 px-4 py-2 text-sm text-muted">
              Total users:{" "}
              <span className="font-semibold text-foreground">{totalUsers}</span>
            </div>
          </div>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-border bg-surface/90 p-5 shadow-lg shadow-black/30 backdrop-blur-md sm:p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">Add user</h2>
          <form
            onSubmit={handleAddUser}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary/45 focus:bg-background"
            />
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter mobile number"
              value={mobile}
              onChange={(e) => setMobile(normalizeMobile(e.target.value))}
              readOnly={Boolean(editingUser)}
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary/45 focus:bg-background"
            />
            <input
              type="text"
              placeholder="Enter position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary/45 focus:bg-background"
            />
            <input
              type="text"
              placeholder="Reporting manager"
              value={reportingManager}
              onChange={(e) => setReportingManager(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary/45 focus:bg-background"
            />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as (typeof locations)[number])}
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/45 focus:bg-background"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <select
              value={employeeType}
              onChange={(e) =>
                setEmployeeType(e.target.value as "" | "fresher" | "lateral")
              }
              className={`w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/45 focus:bg-background ${
                employeeType ? "text-foreground" : "text-muted/70"
              }`}
            >
              <option value="">Employee Type</option>
              <option value="fresher">Fresher</option>
              <option value="lateral">Lateral</option>
            </select>
            <select
              value={entity}
              onChange={(e) =>
                setEntity(e.target.value as "" | "NPCI" | "NBBL" | "NIPL" | "NBSL")
              }
              className={`w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/45 focus:bg-background ${
                entity ? "text-foreground" : "text-muted/70"
              }`}
            >
              <option value="">Entity</option>
              <option value="NPCI">NPCI</option>
              <option value="NBBL">NBBL</option>
              <option value="NIPL">NIPL</option>
              <option value="NBSL">NBSL</option>
            </select>
            <select
              value={band}
              onChange={(e) => setBand(e.target.value as "" | "B1" | "B2")}
              className={`w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition focus:border-primary/45 focus:bg-background ${
                band ? "text-foreground" : "text-muted/70"
              }`}
            >
              <option value="">Band Level</option>
              <option value="B1">B1 &amp; Below</option>
              <option value="B2">B2 &amp; Above</option>
            </select>
            <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-muted transition hover:border-primary/45">
              <span className="truncate">
                {profileImageFile ? profileImageFile.name : "Upload profile image"}
              </span>
              <span>🖼️</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-semibold text-background shadow-lg shadow-black/25 transition disabled:opacity-60"
            >
              {submitting ? (editingUser ? "Updating..." : "Adding...") : (editingUser ? "Update User" : "Add User")}
            </button>
            {editingUser ? (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setName("");
                  setMobile("");
                  setPosition("");
                  setReportingManager("");
                  setLocation("Hyderabad");
                  setEmployeeType("");
                  setEntity("");
                  setBand("");
                  setProfileImageFile(null);
                }}
                className="rounded-xl border border-border bg-background/60 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/45"
              >
                Cancel Edit
              </button>
            ) : null}
          </form>
        </motion.section>

        {/* Document Tracker Summary */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-border bg-surface/90 p-5 shadow-lg shadow-black/30 backdrop-blur-md sm:p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">Document tracker</h2>
          {loading ? (
            <p className="text-sm text-muted">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-background/60 text-muted">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Employee</th>
                    <th className="px-4 py-2.5 text-left font-medium">Uploaded</th>
                    <th className="px-4 py-2.5 text-left font-medium">Pending</th>
                    <th className="px-4 py-2.5 text-left font-medium">Approved</th>
                    <th className="px-4 py-2.5 text-left font-medium">Rejected</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const docs = user.documents || [];
                    const approved = docs.filter((d) => d.status === "approved").length;
                    const rejected = docs.filter((d) => d.status === "rejected").length;
                    const pending = docs.filter((d) => d.status === "pending").length;
                    const allApproved = docs.length > 0 && approved === docs.length;
                    return (
                      <tr key={user.mobile} className="border-t border-border/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Image
                              src={user.profileImageUrl || "/dashboard-profile.png"}
                              alt={user.name || "Profile"}
                              width={28}
                              height={28}
                              className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
                            />
                            <div>
                              <p className="text-xs font-medium text-foreground">{user.name || "Unnamed"}</p>
                              <p className="text-[10px] text-muted">{user.mobile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold">{docs.length}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">{pending}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">{approved}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300">{rejected}</span>
                        </td>
                        <td className="px-4 py-3">
                          {docs.length === 0 ? (
                            <span className="text-[11px] text-muted">No uploads</span>
                          ) : allApproved ? (
                            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">All approved ✓</span>
                          ) : (
                            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">In review</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        <section className="rounded-3xl border border-border bg-surface/90 p-0 shadow-lg shadow-black/30 backdrop-blur-md">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold">User list</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-background/60 text-muted">
                <tr>
                  <th className="px-5 py-3 text-left font-medium sm:px-6">
                    Profile
                  </th>
                  <th className="px-5 py-3 text-left font-medium sm:px-6">
                    Mobile
                  </th>
                  <th className="px-5 py-3 text-left font-medium sm:px-6">
                    Position
                  </th>
                  <th className="px-5 py-3 text-left font-medium sm:px-6">
                    Location
                  </th>
                  <th className="px-5 py-3 text-left font-medium sm:px-6">
                    Allowed
                  </th>
                  <th className="px-5 py-3 text-left font-medium sm:px-6">
                    Verified
                  </th>
                  <th className="px-5 py-3 text-left font-medium sm:px-6">
                    Uploaded Docs
                  </th>
                  <th className="px-5 py-3 text-left font-medium sm:px-6">
                    Documents
                  </th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-8 text-center text-muted sm:px-6"
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-8 text-center text-muted sm:px-6"
                    >
                      No users yet. Add a mobile number to begin.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const rowBusy = busyMobile === user.mobile;
                    const docs = user.documents || [];
                    const isExpanded = expandedMobile === user.mobile;
                    return (
                      <Fragment key={user.mobile}>
                        <tr
                          className="border-t border-border/70 text-foreground/95"
                        >
                          <td className="px-5 py-3 sm:px-6">
                            <div className="flex items-center gap-2.5">
                              <Image
                                src={user.profileImageUrl || "/dashboard-profile.png"}
                                alt={user.name || "Profile"}
                                width={36}
                                height={36}
                                className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                              />
                              <span className="text-xs font-medium text-foreground">
                                {user.name || "Unnamed"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 font-medium sm:px-6">
                            {user.mobile}
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <span className="text-xs text-foreground">
                              {user.position || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <span className="text-xs text-foreground">
                              {user.location || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                user.isAllowed
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-rose-500/15 text-rose-300"
                              }`}
                            >
                              {String(user.isAllowed)}
                            </span>
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                user.isVerified
                                  ? "bg-blue-500/15 text-blue-300"
                                  : "bg-slate-500/20 text-slate-300"
                              }`}
                            >
                              {String(user.isVerified)}
                            </span>
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <span className="font-medium">{user.uploadedDocs}</span>
                          </td>
                          <td className="px-5 py-3 sm:px-6">
                            <span className="text-xs text-muted">
                              {docs.length > 0 ? `${docs.length} uploaded` : "No uploads"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right sm:px-6">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditUser(user)}
                                className="rounded-lg border border-blue-300 bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded && expandedTab === "docs") {
                                    setExpandedMobile(null);
                                  } else {
                                    setExpandedMobile(user.mobile);
                                    setExpandedTab("docs");
                                  }
                                }}
                                className="rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/50"
                              >
                                {isExpanded && expandedTab === "docs" ? "Hide Docs" : "View Docs"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded && expandedTab === "buddy") {
                                    setExpandedMobile(null);
                                  } else {
                                    setExpandedMobile(user.mobile);
                                    setExpandedTab("buddy");
                                  }
                                }}
                                className="rounded-lg border border-violet-300 bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-200"
                              >
                                {isExpanded && expandedTab === "buddy" ? "Hide Insights" : "Buddy Insights"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded && expandedTab === "checkin") {
                                    setExpandedMobile(null);
                                  } else {
                                    setExpandedMobile(user.mobile);
                                    setExpandedTab("checkin");
                                  }
                                }}
                                className="rounded-lg border border-teal-300 bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-200"
                              >
                                {isExpanded && expandedTab === "checkin" ? "Hide Check-In" : "Check-In"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded && expandedTab === "kit") {
                                    setExpandedMobile(null);
                                  } else {
                                    setExpandedMobile(user.mobile);
                                    setExpandedTab("kit");
                                  }
                                }}
                                className="rounded-lg border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
                              >
                                {isExpanded && expandedTab === "kit" ? "Hide Kit" : "🎁 Kit"}
                              </button>
                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() => void handleToggle(user.mobile)}
                                className="rounded-lg border border-primary/30 bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/55 disabled:opacity-60"
                              >
                                {user.isAllowed ? "Block" : "Allow"}
                              </button>
                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() => void handleDelete(user.mobile)}
                                className="rounded-lg border border-rose-300 bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-200 disabled:opacity-60"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr className="border-t border-border/40 bg-background/30">
                            <td colSpan={9} className="px-5 py-4 sm:px-6">
                              {expandedTab === "docs" ? (
                                docs.length === 0 ? (
                                  <p className="text-xs text-muted">
                                    No documents uploaded by this user yet.
                                  </p>
                                ) : (
                                  <div className="grid gap-2.5">
                                    {docs.map((doc) => (
                                      (() => {
                                        const hasFile = Boolean(doc.fileId || doc.fileUrl);
                                        const previewUrl = doc.fileId
                                          ? `/api/documents/file/${encodeURIComponent(doc.fileId)}`
                                          : doc.fileUrl || "";
                                        const downloadUrl = doc.fileId
                                          ? `/api/documents/file/${encodeURIComponent(doc.fileId)}?download=1`
                                          : doc.fileUrl || "";
                                        return (
                                      <div
                                        key={`${user.mobile}-${doc.name}`}
                                        className="rounded-lg border border-border/60 bg-background/40 p-2.5"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-xs font-medium text-foreground">
                                            {doc.name}
                                          </p>
                                          <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                              doc.status === "approved"
                                                ? "bg-emerald-500/15 text-emerald-300"
                                                : doc.status === "rejected"
                                                  ? "bg-rose-500/15 text-rose-300"
                                                  : "bg-amber-500/15 text-amber-300"
                                            }`}
                                          >
                                            {doc.status}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-[10px] text-muted">
                                          {doc.uploadedAt
                                            ? new Date(doc.uploadedAt).toLocaleString()
                                            : "Uploaded recently"}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                          <button
                                            type="button"
                                            disabled={!hasFile}
                                            onClick={() => window.open(previewUrl, "_blank")}
                                            className="rounded-md border border-border bg-background/60 px-2 py-1 text-[10px] font-semibold text-foreground transition hover:border-primary/50 disabled:opacity-50"
                                          >
                                            👁 Preview
                                          </button>
                                          <a
                                            href={downloadUrl}
                                            download
                                            aria-disabled={!hasFile}
                                            className="rounded-md border border-border bg-background/60 px-2 py-1 text-[10px] font-semibold text-foreground transition hover:border-primary/50"
                                          >
                                            ⬇ Download
                                          </a>
                                          <button
                                            type="button"
                                            disabled={rowBusy}
                                            onClick={() =>
                                              void handleDocStatus(
                                                user.mobile,
                                                doc.docId || doc.name,
                                                "approved"
                                              )
                                            }
                                            className="rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:opacity-60"
                                          >
                                            ✅ Approve
                                          </button>
                                          <button
                                            type="button"
                                            disabled={rowBusy}
                                            onClick={() =>
                                              void handleDocStatus(
                                                user.mobile,
                                                doc.docId || doc.name,
                                                "rejected"
                                              )
                                            }
                                            className="rounded-md border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-60"
                                          >
                                            ❌ Reject
                                          </button>
                                        </div>
                                      </div>
                                        );
                                      })()
                                    ))}
                                  </div>
                                )
                              ) : expandedTab === "buddy" ? (
                                <div>
                                  <div className="mb-3 flex items-center gap-2">
                                    <span className="text-base">🌱</span>
                                    <p className="text-xs font-semibold text-violet-300">
                                      Buddy Insights — {user.name || user.mobile}
                                    </p>
                                  </div>
                                  {!user.buddyAnswers || user.buddyAnswers.length === 0 ? (
                                    <p className="text-xs text-muted">
                                      This user hasn&apos;t submitted their buddy answers yet.
                                    </p>
                                  ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {user.buddyAnswers.filter((a) => a.answer?.trim()).map((a) => (
                                        <div
                                          key={a.questionId}
                                          className="rounded-xl border border-violet-400/15 bg-violet-500/8 p-3"
                                        >
                                          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                                            <span>{BUDDY_EMOJIS[a.questionId] ?? "💡"}</span>
                                            {BUDDY_QUESTIONS[a.questionId] ?? a.questionId}
                                          </p>
                                          <p className="text-xs leading-relaxed text-foreground/85">
                                            {a.answer}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : expandedTab === "kit" ? (
                                /* ── Onboarding Kit tab ───────────────────── */
                                <div>
                                  <div className="mb-3 flex items-center gap-2">
                                    <span className="text-base">🎁</span>
                                    <p className="text-xs font-semibold text-amber-300">
                                      Onboarding Kit — {user.name || user.mobile}
                                    </p>
                                  </div>

                                  {!user.onboardingKit || user.onboardingKit.length === 0 ? (
                                    <p className="text-xs text-muted">
                                      This user hasn&apos;t selected their onboarding kit yet.
                                    </p>
                                  ) : (
                                    <>
                                      <p className="mb-3 text-[11px] text-muted">
                                        {user.onboardingKit.length} item{user.onboardingKit.length !== 1 ? "s" : ""} selected
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {KIT_ITEMS.map((item) => {
                                          const chosen = user.onboardingKit!.includes(item.name);
                                          return (
                                            <div
                                              key={item.name}
                                              className={[
                                                "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                                                chosen
                                                  ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                                                  : "border-border/40 bg-background/30 text-muted/50 line-through",
                                              ].join(" ")}
                                            >
                                              <span>{KIT_ICON[item.name] ?? "📦"}</span>
                                              <span>{item.name}</span>
                                              {chosen && <span className="text-[10px] text-amber-400">✓</span>}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                /* ── Check-In tab ─────────────────────────── */
                                <div>
                                  <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">📅</span>
                                      <p className="text-xs font-semibold text-teal-300">
                                        15-Day Check-In — {user.name || user.mobile}
                                      </p>
                                    </div>
                                    {user.checkInAnswers?.submittedAt && (
                                      <span className="text-[10px] text-muted">
                                        Submitted{" "}
                                        {new Date(user.checkInAnswers.submittedAt).toLocaleString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    )}
                                  </div>

                                  {!user.checkInAnswers || user.checkInAnswers.q1 === 0 ? (
                                    <p className="text-xs text-muted">
                                      This user hasn&apos;t submitted their 15-Day Check-In yet.
                                    </p>
                                  ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {(["q1", "q2", "q3"] as const).map((key) => {
                                        const val = user.checkInAnswers![key] as number;
                                        const scale = CHECKIN_SCALE[val];
                                        return (
                                          <div
                                            key={key}
                                            className="rounded-xl border border-teal-400/15 bg-teal-500/8 p-3"
                                          >
                                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
                                              {CHECKIN_QUESTIONS[key]}
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <span className="text-2xl">{scale?.emoji ?? "—"}</span>
                                              <div>
                                                <p className="text-xs font-semibold text-foreground/90">
                                                  {scale?.label ?? "—"}
                                                </p>
                                                <p className="text-[10px] text-muted">{val} / 5</p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}

                                      <div className="rounded-xl border border-teal-400/15 bg-teal-500/8 p-3 sm:col-span-2">
                                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
                                          {CHECKIN_QUESTIONS.q4}
                                        </p>
                                        <p className="text-xs leading-relaxed text-foreground/85">
                                          {user.checkInAnswers.q4?.trim()
                                            ? user.checkInAnswers.q4
                                            : <span className="italic text-muted">No response provided.</span>
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-center text-xs text-muted">
          Temporary admin access is open. Set{" "}
          <code className="rounded bg-background/70 px-1 py-0.5">
            ADMIN_ACCESS_KEY
          </code>{" "}
          and send it as the{" "}
          <code className="rounded bg-background/70 px-1 py-0.5">
            x-admin-key
          </code>{" "}
          header to secure these APIs later.
        </p>

        <p className="text-center text-sm text-muted">
          <Link
            href="/dashboard"
            className="font-medium text-primary underline-offset-4 transition hover:text-primary/85 hover:underline"
          >
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
