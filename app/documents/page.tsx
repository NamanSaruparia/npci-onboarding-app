"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../components/PageHeader";
import { SessionLoading } from "../components/SessionLoading";
import { useRequireSession } from "../hooks/useRequireSession";
import { useAppContext } from "../context/AppContext";
import { useNotifications } from "../context/NotificationContext";
import { parseSessionUser, type SessionUser } from "@/app/lib/session";

type BackendDocStatus = "pending" | "approved" | "rejected";

type Doc = {
  name: string;
  fileName?: string;
  fileUrl?: string;
  status: BackendDocStatus;
  downloadLink?: string;
};

type Category = {
  title: string;
  docs: Doc[];
};

function statusMeta(doc: Doc) {
  if (!doc.fileUrl) {
    return {
      label: "📝 Not Uploaded",
      className: "bg-slate-50 text-slate-600 border border-slate-200",
    };
  }
  if (doc.status === "approved") {
    return {
      label: "✅ Approved",
      className: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    };
  }
  if (doc.status === "rejected") {
    return {
      label: "❌ Rejected",
      className: "bg-rose-50 text-rose-600 border border-rose-200",
    };
  }
  return {
    label: "⏳ In Review",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  };
}

function findDocByName(categories: Category[], docName: string): Doc | undefined {
  for (const c of categories) {
    const d = c.docs.find((x) => x.name === docName);
    if (d) return d;
  }
  return undefined;
}

export default function Documents() {
  const router = useRouter();
  const { ready, sessionUser } = useRequireSession();
  const { uploadedDocs, setUploadedDocs, totalDocs } = useAppContext();
  const { addNotification } = useNotifications();

  const [user, setUser] = useState<SessionUser | null>(null);

  const [categories, setCategories] = useState<Category[]>([
    {
      title: "Education",
      docs: [
        { name: "SSC Marksheet", status: "pending" },
        { name: "HSC Marksheet", status: "pending" },
        { name: "UG Certificates", status: "pending" },
        { name: "PG Certificates (if any)", status: "pending" },
        { name: "Other Certifications", status: "pending" },
      ],
    },
    {
      title: "Identity",
      docs: [
        { name: "Passport", status: "pending" },
        { name: "Driving License", status: "pending" },
        { name: "Voter ID", status: "pending" },
        { name: "PAN & Aadhaar (Mandatory)", status: "pending" },
        { name: "Address Proof", status: "pending" },
      ],
    },
    {
      title: "Mandatory NPCI",
      docs: [
        {
          name: "Offer Letter (Download → Sign → Upload)",
          status: "pending",
          downloadLink: "/documents/offer-letter.pdf",
        },
        {
          name: "NPCI Declaration (Download → Sign → Upload)",
          status: "pending",
          downloadLink: "/documents/npci-declaration.pdf",
        },
        {
          name: "NPCI Form (Download → Sign → Upload)",
          status: "pending",
          downloadLink: "/documents/npci-form.pdf",
        },
        { name: "Cancelled Cheque", status: "pending" },
        { name: "Resume", status: "pending" },
      ],
    },
  ]);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as SessionUser;
        setUser(parsed && typeof parsed === "object" ? parsed : null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (sessionUser) setUser(sessionUser);
  }, [sessionUser]);

  useEffect(() => {
    if (!ready) return;

    const mobile = parseSessionUser(localStorage.getItem("user"))?.mobile;
    if (!mobile) return;

    const load = async () => {
      try {
        const res = await fetch("/api/get-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile }),
        });
        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("RAW RESPONSE:", text);
          toast.error("Server crashed. Check terminal.");
          return;
        }
        if (!res.ok || !data?.user) return;

        const serverDocs = Array.isArray(data.user.documents)
          ? data.user.documents
          : [];

        setCategories((prev) =>
          prev.map((category) => ({
            ...category,
            docs: category.docs.map((doc) => {
              const saved = serverDocs.find(
                (item: { name: string }) => item.name === doc.name
              );
              if (!saved) return doc;
              return {
                ...doc,
                fileName: saved.fileUrl ? "Uploaded file" : undefined,
                fileUrl: saved.fileUrl || undefined,
                status: (saved.status || "pending") as BackendDocStatus,
              };
            }),
          }))
        );

        if (typeof data.user.uploadedDocs === "number") {
          setUploadedDocs(data.user.uploadedDocs);
        }
      } catch {
        /* non-blocking */
      }
    };

    void load();
  }, [ready, setUploadedDocs]);

  const validateFile = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error("Use PDF, JPG, or PNG only.");
      return false;
    }

    if (file.size > maxSize) {
      toast.error("Each file must be under 5 MB.");
      return false;
    }

    return true;
  };

  const handleUpload = async (file: File, docName: string) => {
    if (!file) return;

    const latest = parseSessionUser(localStorage.getItem("user"));
    const mobile = latest?.mobile ?? user?.mobile;

    console.log("USER:", user);
    console.log("FILE:", file);

    if (!mobile) {
      alert("Session expired. Please login again.");
      return;
    }

    if (!validateFile(file)) return;

    const row = findDocByName(categories, docName);
    if (row?.status === "approved") {
      toast("Approved documents cannot be re-uploaded.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mobile", mobile);
    formData.append("documentName", docName);

    try {
      const res = await fetch("/api/update-docs", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("RAW RESPONSE:", text);
        toast.error("Server crashed. Check terminal.");
        return;
      }

      if (res.ok && data.success) {
        toast.success("Document uploaded successfully.");
        addNotification("Your document has been uploaded and is pending review.");
        window.location.reload();
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const progress = Math.floor((uploadedDocs / totalDocs) * 100);

  if (!ready || !sessionUser) {
    return <SessionLoading />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="app-page-base rounded-[24px] p-4 shadow-sm sm:p-6">
          <PageHeader
            title="Documents"
            subtitle="Upload and track compliance files before joining."
            titleEmoji="📄"
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
            <span className="text-base" aria-hidden>
              ←
            </span>
            Dashboard
          </button>

          <header className="mb-6 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Document checklist
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-gray-500">
              Upload credentials in PDF or image format. Files are validated
              before they count toward your progress.
            </p>
          </header>

          <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Completion
              </h2>
              <p className="text-sm tabular-nums text-slate-500">
                {uploadedDocs}/{totalDocs}
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{progress}%</span>{" "}
              of required items on file.
            </p>
          </section>

          <div className="space-y-8">
            {categories.map((category, catIndex) => (
              <section
                key={catIndex}
                className={`rounded-2xl p-4 ${
                  catIndex === 0
                    ? "bg-[#eef0ff]"
                    : catIndex === 1
                      ? "bg-[#eaf4ff]"
                      : "bg-[#edf7f1]"
                }`}
              >
                <h2 className="mb-4 text-base font-semibold text-slate-800">
                  {category.title}
                </h2>

                <ul className="space-y-3">
                  {category.docs.map((doc, docIndex) => (
                    <motion.li
                      key={docIndex}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium leading-snug text-slate-800">
                          {doc.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta(doc).className}`}
                          >
                            {statusMeta(doc).label}
                          </span>
                          {doc.fileName ? (
                            <span className="text-xs text-slate-500">
                              {doc.fileName}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        {doc.downloadLink && (
                          <a
                            href={doc.downloadLink}
                            download
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:border-gray-300"
                          >
                            <span className="text-base">⬇️</span>
                            Download
                          </a>
                        )}

                        <label
                          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition ${
                            doc.status === "approved"
                              ? "cursor-not-allowed bg-slate-300"
                              : "cursor-pointer bg-gradient-to-r from-primary to-secondary hover:opacity-95"
                          }`}
                        >
                          <span className="text-base">⬆️</span>
                          {doc.status === "approved" ? "Locked" : "Upload"}
                          <input
                            type="file"
                            className="hidden"
                            disabled={doc.status === "approved"}
                            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handleUpload(f, doc.name);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
}
