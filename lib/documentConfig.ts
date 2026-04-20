export type DocumentCondition = {
  employeeType?: "fresher" | "lateral";
  entity?: "NPCI" | "NBBL" | "NBSL" | "NIPL";
  band?: "B1" | "B2";
};

export type TemplateDocumentType =
  | "offer_letter"
  | "declaration_of_relationship"
  | "undertaking"
  | "employment_declaration"
  | "fresher_specific"
  | "lateral_specific";

export type DocumentItem = {
  id: string;
  name: string;
  category: "education" | "identity" | "employment" | "other" | "legal";
  requiresDownload: boolean;
  template: string;
  documentType?: TemplateDocumentType;
  condition?: DocumentCondition;
};

export const DOCUMENTS: DocumentItem[] = [
  // EDUCATION (UPLOAD ONLY, NO TEMPLATE DOWNLOAD)
  {
    id: "ssc",
    name: "SSC Marksheet",
    category: "education",
    requiresDownload: false,
    template: "",
  },
  {
    id: "hsc",
    name: "HSC Marksheet",
    category: "education",
    requiresDownload: false,
    template: "",
  },
  {
    id: "ug",
    name: "UG Certificate",
    category: "education",
    requiresDownload: false,
    template: "",
  },
  {
    id: "pg",
    name: "PG Certificate",
    category: "education",
    requiresDownload: false,
    template: "",
  },

  // IDENTITY (UPLOAD ONLY, NO TEMPLATE DOWNLOAD)
  {
    id: "aadhaar",
    name: "Aadhaar Card",
    category: "identity",
    requiresDownload: false,
    template: "",
  },
  {
    id: "pan",
    name: "PAN Card",
    category: "identity",
    requiresDownload: false,
    template: "",
  },
  {
    id: "address",
    name: "Address Proof",
    category: "identity",
    requiresDownload: false,
    template: "",
  },

  // EMPLOYMENT SUPPORTING DOCS (UPLOAD ONLY)
  {
    id: "relieving",
    name: "Relieving Letter",
    category: "employment",
    requiresDownload: false,
    template: "",
    condition: { employeeType: "lateral" },
  },
  {
    id: "payslips",
    name: "Last 3 Months Payslips",
    category: "employment",
    requiresDownload: false,
    template: "",
    condition: { employeeType: "lateral" },
  },

  // ENTITY DECLARATIONS (DOWNLOAD + SIGN + UPLOAD)
  {
    id: "declaration_npci",
    name: "NPCI-Declaration.pdf",
    category: "legal",
    requiresDownload: true,
    template: "NPCI-Declaration.pdf",
    documentType: "declaration_of_relationship",
    condition: { entity: "NPCI" },
  },
  {
    id: "declaration_nbbl",
    name: "NBBL - Declaration.pdf",
    category: "legal",
    requiresDownload: true,
    template: "NBBL - Declaration.pdf",
    documentType: "declaration_of_relationship",
    condition: { entity: "NBBL" },
  },
  {
    id: "declaration_nbsl",
    name: "NBSL - Declaration.pdf",
    category: "legal",
    requiresDownload: true,
    template: "NBSL - Declaration.pdf",
    documentType: "declaration_of_relationship",
    condition: { entity: "NBSL" },
  },
  {
    id: "declaration_nipl",
    name: "NIPL - Declaration.pdf",
    category: "legal",
    requiresDownload: true,
    template: "NIPL - Declaration.pdf",
    documentType: "declaration_of_relationship",
    condition: { entity: "NIPL" },
  },

  // UNDERTAKINGS (DOWNLOAD + SIGN + UPLOAD, BAND BASED)
  {
    id: "undertaking_b1",
    name: "Undertaking of Secrecy B1 & Below.pdf",
    category: "legal",
    requiresDownload: true,
    template: "Undertaking of Secrecy B1 & Below.pdf",
    documentType: "undertaking",
    condition: { band: "B1" },
  },
  {
    id: "undertaking_b2",
    name: "Undertaking of Secrecy_B2 and above.pdf",
    category: "legal",
    requiresDownload: true,
    template: "Undertaking of Secrecy_B2 and above.pdf",
    documentType: "undertaking",
    condition: { band: "B2" },
  },

  // LATERAL ONBOARDING FORMS (ENTITY + LATERAL)
  {
    id: "lateral_npci",
    name: "NPCI-L.pdf",
    category: "other",
    requiresDownload: true,
    template: "NPCI-L.pdf",
    documentType: "lateral_specific",
    condition: { employeeType: "lateral", entity: "NPCI" },
  },
  {
    id: "lateral_nbbl",
    name: "NBBL - L.pdf",
    category: "other",
    requiresDownload: true,
    template: "NBBL - L.pdf",
    documentType: "lateral_specific",
    condition: { employeeType: "lateral", entity: "NBBL" },
  },
  {
    id: "lateral_nbsl",
    name: "NBSL - L.pdf",
    category: "other",
    requiresDownload: true,
    template: "NBSL - L.pdf",
    documentType: "lateral_specific",
    condition: { employeeType: "lateral", entity: "NBSL" },
  },
  {
    id: "lateral_nipl",
    name: "NIPL - L.pdf",
    category: "other",
    requiresDownload: true,
    template: "NIPL - L.pdf",
    documentType: "lateral_specific",
    condition: { employeeType: "lateral", entity: "NIPL" },
  },

  // FRESHER ONBOARDING FORMS (ENTITY + FRESHER)
  {
    id: "fresher_npci_1",
    name: "NPCI-F Onboarding Forms.pdf",
    category: "other",
    requiresDownload: true,
    template: "NPCI-F Onboarding Forms.pdf",
    documentType: "fresher_specific",
    condition: { employeeType: "fresher", entity: "NPCI" },
  },
  {
    id: "fresher_npci_2",
    name: "NPCI-F Onboarding Forms_1.pdf",
    category: "other",
    requiresDownload: true,
    template: "NPCI-F Onboarding Forms_1.pdf",
    documentType: "fresher_specific",
    condition: { employeeType: "fresher", entity: "NPCI" },
  },
  {
    id: "fresher_nbbl_1",
    name: "NBBL-F.pdf",
    category: "other",
    requiresDownload: true,
    template: "NBBL-F.pdf",
    documentType: "fresher_specific",
    condition: { employeeType: "fresher", entity: "NBBL" },
  },
  {
    id: "fresher_nbbl_2",
    name: "NBBL-F_1.pdf",
    category: "other",
    requiresDownload: true,
    template: "NBBL-F_1.pdf",
    documentType: "fresher_specific",
    condition: { employeeType: "fresher", entity: "NBBL" },
  },
  {
    id: "fresher_nbsl_1",
    name: "NBSL-F.pdf",
    category: "other",
    requiresDownload: true,
    template: "NBSL-F.pdf",
    documentType: "fresher_specific",
    condition: { employeeType: "fresher", entity: "NBSL" },
  },
  {
    id: "fresher_nbsl_2",
    name: "NBSL-F_1.pdf",
    category: "other",
    requiresDownload: true,
    template: "NBSL-F_1.pdf",
    documentType: "fresher_specific",
    condition: { employeeType: "fresher", entity: "NBSL" },
  },
  {
    id: "fresher_nipl_1",
    name: "NIPL-F.pdf",
    category: "other",
    requiresDownload: true,
    template: "NIPL-F.pdf",
    documentType: "fresher_specific",
    condition: { employeeType: "fresher", entity: "NIPL" },
  },
  {
    id: "fresher_nipl_2",
    name: "NIPL-F_1.pdf",
    category: "other",
    requiresDownload: true,
    template: "NIPL-F_1.pdf",
    documentType: "fresher_specific",
    condition: { employeeType: "fresher", entity: "NIPL" },
  },
];

export function filterDocuments(userProfile: {
  employeeType: "fresher" | "lateral";
  entity: "NPCI" | "NBBL" | "NBSL" | "NIPL";
  band: "B1" | "B2";
}) {
  return DOCUMENTS.filter((doc) => {
    if (!doc.condition) return true;

    if (
      doc.condition.employeeType &&
      doc.condition.employeeType !== userProfile.employeeType
    ) {
      return false;
    }
    if (doc.condition.entity && doc.condition.entity !== userProfile.entity) {
      return false;
    }
    if (doc.condition.band && doc.condition.band !== userProfile.band) {
      return false;
    }

    return true;
  });
}
