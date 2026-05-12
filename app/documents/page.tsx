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
import {
  filterDocuments,
  type DocumentItem,
} from "@/app/lib/documentConfig";

type BackendDocStatus = "pending" | "approved" | "rejected";

type Doc = {
  id: string;
  name: string;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  status: BackendDocStatus;
  requiresDownload: boolean;
  template: string;
  templateInEntityFolder: boolean;
};

type Category = {
  key: DocumentItem["category"];
  title: string;
  docs: Doc[];
};

type UserProfile = {
  employeeType: "fresher" | "lateral";
  entity: "NPCI" | "NBBL" | "NBSL" | "NIPL";
  band: "B1" | "B2";
};

type UserDocRecord = {
  docId?: string;
  name: string;
  fileId?: string;
  fileUrl?: string;
  status?: string;
};

type GetUserResponse = {
  success?: boolean;
  user?: {
    employeeType?: string;
    entity?: string;
    band?: string;
    documents?: UserDocRecord[];
    uploadedDocs?: number;
  };
};

type UploadResponse = {
  success?: boolean;
  fileId?: string;
  fileUrl?: string;
};

const CATEGORY_ORDER: DocumentItem["category"][] = [
  "education",
  "identity",
  "employment",
  "other",
  "legal",
];

const CATEGORY_TITLES: Record<DocumentItem["category"], string> = {
  education: "Education",
  identity: "Identity",
  employment: "Employment",
  other: "Other",
  legal: "Legal",
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

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

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
        let data: GetUserResponse;
        try {
          data = JSON.parse(text) as GetUserResponse;
        } catch {
          console.error("RAW RESPONSE:", text);
          toast.error("Server crashed. Check terminal.");
          return;
        }
        if (!res.ok || !data?.user) return;

        const rawEntity = data.user.entity ?? "";
        const entityOptions: UserProfile["entity"][] = [
          "NPCI",
          "NBBL",
          "NBSL",
          "NIPL",
        ];
        const normalizedProfile: UserProfile = {
          employeeType: data.user.employeeType === "lateral" ? "lateral" : "fresher",
          entity: entityOptions.includes(rawEntity as UserProfile["entity"])
            ? (rawEntity as UserProfile["entity"])
            : "NPCI",
          band: data.user.band === "B2" ? "B2" : "B1",
        };
        setUserProfile(normalizedProfile);

        const documents = filterDocuments(normalizedProfile);
        const groupedDocs = documents.reduce((acc, doc) => {
          if (!acc[doc.category]) acc[doc.category] = [];
          acc[doc.category].push(doc);
          return acc;
        }, {} as Record<string, typeof documents>);

        const serverDocs = Array.isArray(data.user.documents) ? data.user.documents : [];

        const nextCategories: Category[] = CATEGORY_ORDER.filter(
          (category) => groupedDocs[category]?.length
        ).map((category) => ({
          key: category,
          title: CATEGORY_TITLES[category],
          docs: groupedDocs[category].map((doc) => {
            const saved = serverDocs.find(
              (item) => item.docId === doc.id || item.name === doc.name
            );
            return {
              id: doc.id,
              name: doc.name,
              template: doc.template,
              templateInEntityFolder: Boolean(doc.condition?.entity),
              requiresDownload: doc.requiresDownload,
              fileName: saved?.fileUrl ? "Uploaded file" : undefined,
              fileId: saved?.fileId || undefined,
              fileUrl: saved?.fileUrl || undefined,
              status: (saved?.status || "pending") as BackendDocStatus,
            };
          }),
        }));

        setCategories(nextCategories);

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
    const mobile = latest?.mobile ?? (sessionUser as SessionUser | null)?.mobile;

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
    formData.append("documentId", row?.id ?? docName);

    try {
      const res = await fetch("/api/update-docs", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data: UploadResponse;
      try {
        data = JSON.parse(text) as UploadResponse;
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

  const handleDownload = (doc: Doc) => {
    if (!doc.template) {
      toast.error("Template not available");
      return;
    }
    if (!userProfile) {
      toast.error("User profile not loaded");
      return;
    }

    const entity = userProfile.entity.toLowerCase();
    const templateFile = encodeURIComponent(doc.template);
    const fileUrl = doc.templateInEntityFolder
      ? `/templates/${entity}/${templateFile}`
      : `/templates/${templateFile}`;

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = doc.template;
    link.click();
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
                key={category.key}
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
                  {category.docs.map((doc) => (
                    <motion.li
                      key={doc.id}
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
                        {doc.requiresDownload && (
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:border-gray-300"
                          >
                            <span className="text-base">⬇️</span>
                            Download
                          </button>
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

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-gray-300 hover:text-slate-900"
          >
            <span className="text-base" aria-hidden>
              ←
            </span>
            Dashboard
          </button>
        </motion.div>
        </div>
      </div>
    </div>
  );
}
