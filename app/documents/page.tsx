"use client";

import { useState } from "react";
import { useAppContext } from "../context/AppContext";

type Status = "Pending" | "Uploaded" | "Verified";

type Doc = {
  name: string;
  file: File | null;
  status: Status;
  downloadLink?: string;
};

type Category = {
  title: string;
  docs: Doc[];
};

export default function Documents() {
  const { uploadedDocs, setUploadedDocs, totalDocs } = useAppContext();

  const [categories, setCategories] = useState<Category[]>([
    {
      title: "🎓 Education Documents",
      docs: [
        { name: "SSC Marksheet", file: null, status: "Pending" },
        { name: "HSC Marksheet", file: null, status: "Pending" },
        { name: "UG Certificates", file: null, status: "Pending" },
        { name: "PG Certificates (if any)", file: null, status: "Pending" },
        { name: "Other Certifications", file: null, status: "Pending" },
      ],
    },
    {
      title: "🪪 Identity Documents",
      docs: [
        { name: "Passport", file: null, status: "Pending" },
        { name: "Driving License", file: null, status: "Pending" },
        { name: "Voter ID", file: null, status: "Pending" },
        { name: "PAN & Aadhaar (Mandatory)", file: null, status: "Pending" },
        { name: "Address Proof", file: null, status: "Pending" },
      ],
    },
    {
      title: "📄 Mandatory NPCI Documents",
      docs: [
        {
          name: "Offer Letter (Download → Sign → Upload)",
          file: null,
          status: "Pending",
          downloadLink: "/documents/offer-letter.pdf",
        },
        {
          name: "NPCI Declaration (Download → Sign → Upload)",
          file: null,
          status: "Pending",
          downloadLink: "/documents/npci-declaration.pdf",
        },
        {
          name: "NPCI Form (Download → Sign → Upload)",
          file: null,
          status: "Pending",
          downloadLink: "/documents/npci-form.pdf",
        },
        { name: "Cancelled Cheque", file: null, status: "Pending" },
        { name: "Resume", file: null, status: "Pending" },
      ],
    },
  ]);

  // FILE VALIDATION
  const validateFile = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF, JPG, PNG allowed");
      return false;
    }

    if (file.size > maxSize) {
      alert("File must be under 5MB");
      return false;
    }

    return true;
  };

  const handleUpload = async (
    catIndex: number,
    docIndex: number,
    file: File
  ) => {
    if (!validateFile(file)) return;
  
    const updated = [...categories];
    const currentDoc = updated[catIndex].docs[docIndex];
  
    let newCount = uploadedDocs;
  
    // Prevent double count
    if (currentDoc.status === "Pending") {
      newCount = uploadedDocs + 1;
      setUploadedDocs(newCount);
    }
  
    updated[catIndex].docs[docIndex].file = file;
    updated[catIndex].docs[docIndex].status = "Uploaded";
  
    setCategories(updated);
  
    // 🔥 BACKEND CALL
    const user =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : {};
  
    if (user?.email) {
      await fetch("/api/update-docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          uploadedDocs: newCount,
        }),
      });
    }
  };
  const progress = Math.floor((uploadedDocs / totalDocs) * 100);

  return (
    <div className="min-h-screen bg-black text-white p-5">

      {/* HEADER */}
      <h1 className="text-2xl font-semibold mb-2">
        📄 Document Upload
      </h1>

      <p className="text-gray-400 text-sm mb-4">
        Upload all required documents before joining
      </p>

      {/* PROGRESS */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Completion</span>
          <span>{uploadedDocs}/{totalDocs}</span>
        </div>

        <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 to-green-500 h-3"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="space-y-6">

        {categories.map((category, catIndex) => (
          <div key={catIndex}>

            <h2 className="text-lg font-semibold mb-3">
              {category.title}
            </h2>

            <div className="space-y-3">

              {category.docs.map((doc, docIndex) => (
                <div
                  key={docIndex}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{doc.name}</p>

                    <p
                      className={`text-sm ${
                        doc.status === "Pending"
                          ? "text-gray-400"
                          : doc.status === "Uploaded"
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {doc.status}
                      {doc.file && `: ${doc.file.name}`}
                    </p>
                  </div>

                  <div className="flex gap-2">

                    {/* DOWNLOAD */}
                    {doc.downloadLink && (
                      <a
                        href={doc.downloadLink}
                        download
                        className="bg-gray-700 px-3 py-2 rounded-lg text-xs hover:bg-gray-600"
                      >
                        Download
                      </a>
                    )}

                    {/* UPLOAD */}
                    <label className="cursor-pointer bg-gradient-to-r from-orange-500 to-green-500 px-4 py-2 rounded-lg text-sm">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files &&
                          handleUpload(
                            catIndex,
                            docIndex,
                            e.target.files[0]
                          )
                        }
                      />
                    </label>

                  </div>
                </div>
              ))}

            </div>
          </div>
        ))}

      </div>

    </div>
  );
}