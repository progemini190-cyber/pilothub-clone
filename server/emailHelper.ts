import nodemailer from "nodemailer";

export const PILOTHUB_ADMIN_NOTIFICATION_EMAIL = "chatpilot.mm@gmail.com";

const PILOTHUB_LOGO_URL = "https://www.pilothub.vip/pilothub-logo.png";

/** Verified Gmail account used for SMTP auth (display name overridden below). */
function getSmtpUser(): string | undefined {
  return process.env.GMAIL_USER?.trim();
}

/**
 * Sender shown in inboxes: "PilotHub Team" <noreply@pilothub.vip> when configured,
 * otherwise "PilotHub Team" <GMAIL_USER>.
 */
export function getPilotHubEmailFrom(): string {
  const smtpUser = getSmtpUser();
  const noreply = process.env.PILOTHUB_NOREPLY_EMAIL?.trim() || "noreply@pilothub.vip";
  const fromAddress = noreply.includes("@") ? noreply : smtpUser ?? noreply;
  return `"PilotHub Team" <${fromAddress}>`;
}

/** Base HTML wrapper with PilotHub logo and dark theme layout. */
export function wrapPilotHubEmailHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a1628; color: #e2e8f0; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #0f1f35; border-radius: 16px; overflow: hidden; border: 1px solid #1e3a5f;">
    <div style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #1e3a5f; background: linear-gradient(135deg, #0f2a1e 0%, #0a1628 100%);">
      <img src="${PILOTHUB_LOGO_URL}" alt="PilotHub Logo" style="height: 50px; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />
      <p style="color: #64748b; font-size: 13px; margin: 0;">by ChatPilot</p>
    </div>
    <div style="padding: 32px 40px;">
      ${bodyHtml}
    </div>
    <div style="padding: 20px 40px; border-top: 1px solid #1e3a5f; text-align: center;">
      <p style="color: #334155; font-size: 12px; margin: 0;">Powered by ChatPilot · Myanmar Business AI Platform</p>
    </div>
  </div>
</body>
</html>`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToEmailHtml(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, "<br />");
}

/**
 * Send an email via Gmail SMTP.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD environment variables.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}): Promise<boolean> {
  const user = getSmtpUser();
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn("[Email] GMAIL_USER or GMAIL_APP_PASSWORD not set. Email not sent.");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: getPilotHubEmailFrom(),
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

export type ApplicationNotificationInput = {
  fullName: string;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  useCase?: string | null;
  plan?: string | null;
  source?: string | null;
  applicationId?: number;
};

/** Notify admin when a new application is submitted. */
export async function sendNewApplicationNotificationEmail(
  app: ApplicationNotificationInput,
): Promise<boolean> {
  const rows = [
    ["Name", app.fullName],
    ["Email", app.email],
    ["Phone", app.phone ?? "—"],
    ["Business", app.businessName ?? "—"],
    ["Business Type", app.businessType ?? "—"],
    ["Use Case", app.useCase ?? "—"],
    ["Plan", app.plan ?? "free"],
    ["Source", app.source ?? "website"],
    ...(app.applicationId != null ? [["Application ID", String(app.applicationId)]] : []),
  ] as const;

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding: 8px 12px; color: #64748b; font-size: 13px; vertical-align: top; width: 140px;">${escapeHtml(label)}</td>
          <td style="padding: 8px 12px; color: #f1f5f9; font-size: 14px;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const bodyHtml = `
    <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 20px;">New application received</h2>
    <table style="width: 100%; border-collapse: collapse; background: #0a1628; border-radius: 12px; border: 1px solid #1e3a5f;">
      ${tableRows}
    </table>
    <p style="color: #475569; font-size: 13px; margin: 24px 0 0;">
      Review in the <a href="https://www.pilothub.vip/admin/applications" style="color: #22c55e;">Admin Applications</a> panel.
    </p>
  `;

  const plain = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  return sendEmail({
    to: PILOTHUB_ADMIN_NOTIFICATION_EMAIL,
    subject: "New PilotHub Application Received!",
    html: wrapPilotHubEmailHtml(bodyHtml),
    text: `New PilotHub Application Received!\n\n${plain}`,
  });
}

/** Admin broadcast email to one or many recipients. */
export async function sendBroadcastEmail({
  to,
  subject,
  message,
}: {
  to: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const bodyHtml = `
    <div style="color: #94a3b8; line-height: 1.7; font-size: 15px;">
      ${textToEmailHtml(message)}
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html: wrapPilotHubEmailHtml(bodyHtml),
    text: message,
  });
}

/**
 * Send welcome email to approved applicant
 */
export async function sendApprovalEmail({
  to,
  name,
  plan,
  loginUrl,
}: {
  to: string;
  name: string;
  plan?: string | null;
  loginUrl: string;
}): Promise<boolean> {
  const planName = plan === "bizpilot" ? "BizPilot" : plan === "founderpilot" ? "FounderPilot" : "Free Trial";
  const bodyHtml = `
      <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px;">ကြိုဆိုပါသည်, ${escapeHtml(name)}!</h2>
      <p style="color: #94a3b8; line-height: 1.7; margin: 0 0 24px;">
        သင်၏ PilotHub application ကို approved ပြုလုပ်ပြီးပါပြီ။
        ယခု <strong style="color: #22c55e;">free plan</strong> ဖြင့် စတင်စမ်းသပ်နိုင်ပြီး AI advisors များကို အသုံးပြုနိုင်ပါပြီ။
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 0;">${escapeHtml(loginUrl)} သို့ ဝင်ရောက်ပါ</p>
      </div>
      <div style="background: #0a1628; border-radius: 12px; padding: 24px; border: 1px solid #1e3a5f;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">ရရှိမည့် features (${escapeHtml(planName)})</p>
        <ul style="color: #94a3b8; line-height: 2; margin: 0; padding-left: 20px;">
          <li><strong style="color: #22c55e;">BizPilot AI</strong> — Business strategy & operations</li>
          <li><strong style="color: #f59e0b;">FounderPilot AI</strong> — Founder & CEO advisory</li>
          <li>Myanmar business context နားလည်သော AI</li>
        </ul>
      </div>
      <p style="color: #475569; font-size: 13px; margin: 24px 0 0; text-align: center;">
        မေးခွန်းများရှိပါက <a href="mailto:chatpilot.mm@gmail.com" style="color: #22c55e;">chatpilot.mm@gmail.com</a> သို့ ဆက်သွယ်ပါ
      </p>
  `;

  return sendEmail({
    to,
    subject: `✅ PilotHub Application Approved — ကြိုဆိုပါသည် ${name}!`,
    html: wrapPilotHubEmailHtml(bodyHtml),
    text: `ကြိုဆိုပါသည် ${name}!\n\nသင်၏ PilotHub application ကို approved ပြုလုပ်ပြီးပါပြီ။\nfree plan ဖြင့် စတင်စမ်းသပ်နိုင်ပြီး AI advisors များကို အသုံးပြုနိုင်ပါပြီ။\n\n${loginUrl} သို့ ဝင်ရောက်ပါ\n\nPowered by ChatPilot`,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail({
  to,
  name,
  plan,
}: {
  to: string;
  name: string;
  plan: string;
}): Promise<boolean> {
  const planName = plan === "bizpilot" ? "BizPilot" : plan === "founderpilot" ? "FounderPilot" : plan;
  const bodyHtml = `
      <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px;">💳 Payment Confirmed!</h2>
      <p style="color: #94a3b8; line-height: 1.7;">
        ${escapeHtml(name)} ၏ <strong style="color: #22c55e;">${escapeHtml(planName)}</strong> plan payment ကို confirmed ပြုလုပ်ပြီးပါပြီ။
        Subscription ကို activate ပြုလုပ်ပြီးပါပြီ။
      </p>
  `;

  return sendEmail({
    to,
    subject: `✅ PilotHub Payment Confirmed — ${planName} Plan`,
    html: wrapPilotHubEmailHtml(bodyHtml),
    text: `${name} ၏ ${planName} plan payment ကို confirmed ပြုလုပ်ပြီးပါပြီ။\n\nPowered by ChatPilot`,
  });
}
