import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

export async function sendUemApprovalNotification({
  employeeName,
  employeeMobile,
  documentName,
  approvedAt,
}: {
  employeeName: string;
  employeeMobile: string;
  documentName: string;
  approvedAt: string;
}) {
  const uemEmail = process.env.UEM_TEAM_EMAIL;
  if (!uemEmail) {
    console.warn("[Email] UEM_TEAM_EMAIL not set — skipping notification.");
    return;
  }

  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
      <div style="background: #fff; border-radius: 10px; padding: 28px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1e293b; margin-top: 0;">✅ Document Approved — Action Required</h2>
        <p style="color: #475569; line-height: 1.6;">
          An HR document has been approved for a new NPCI joiner. Please initiate the UEM device provisioning process.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 40%;">Employee Name</td>
            <td style="padding: 10px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${employeeName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Mobile</td>
            <td style="padding: 10px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${employeeMobile}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Document Approved</td>
            <td style="padding: 10px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${documentName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Approved At</td>
            <td style="padding: 10px 0; color: #1e293b; font-weight: 600; font-size: 14px;">${approvedAt}</td>
          </tr>
        </table>
        <p style="color: #475569; font-size: 13px; margin-bottom: 0;">
          This is an automated notification from the NPCI Onboarding platform. Please do not reply to this email.
        </p>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">NPCI Navigators · Onboarding System</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"NPCI Onboarding" <${process.env.SMTP_USER}>`,
    to: uemEmail,
    subject: `[NPCI Onboarding] Document Approved — ${employeeName} · ${documentName}`,
    html,
  });
}
