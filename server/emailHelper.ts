import nodemailer from "nodemailer";

export const PILOTHUB_ADMIN_NOTIFICATION_EMAIL = "chatpilot.mm@gmail.com";

/**
 * Gmail requires the From address to match the authenticated account.
 * Do not use unverified aliases (e.g. noreply@pilothub.vip).
 */
export function getPilotHubEmailFrom(): string {
  const user = process.env.GMAIL_USER?.trim() ?? "";
  return `"PilotHub Team" <${user}>`;
}

/** Strip HTML tags for plain-text multipart emails (spam-filter friendly). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Base HTML wrapper with responsive table layout and light professional theme. */
export function wrapPilotHubEmailHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>PilotHub</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f1f5f9; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-collapse: collapse; border-radius: 8px; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 32px 40px 20px; text-align: center; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
              <h1 style="color: #0d9488; margin: 0; font-family: sans-serif;">PilotHub</h1>
              <p style="color: #64748b; margin-top: 5px; font-size: 14px;">by ChatPilot</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px; color: #334155; font-size: 15px; line-height: 1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center; background-color: #f8fafc;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">Powered by ChatPilot · Myanmar Business AI Platform</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!user || !pass) {
    console.warn("[Email] GMAIL_USER or GMAIL_APP_PASSWORD not set. Email not sent.", {
      hasUser: Boolean(user),
      hasPass: Boolean(pass),
    });
    return false;
  }

  const from = `"PilotHub Team" <${user}>`;
  const htmlContent = html ?? "";
  const textContent = text ?? (htmlContent ? htmlToPlainText(htmlContent) : "");

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass: pass.replace(/\s/g, ""),
      },
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent || undefined,
    });

    console.log(`[Email] Sent to ${to}: ${subject} (from ${user})`);
    return true;
  } catch (error) {
    console.error("Email send error details: ", error);
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
          <td style="padding: 10px 14px; color: #64748b; font-size: 13px; vertical-align: top; width: 140px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(label)}</td>
          <td style="padding: 10px 14px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const bodyHtml = `
    <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 20px; font-weight: 600;">New application received</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
      ${tableRows}
    </table>
    <p style="color: #64748b; font-size: 13px; margin: 24px 0 0;">
      Review in the <a href="https://www.pilothub.vip/admin/applications" style="color: #0d9488; text-decoration: none;">Admin Applications</a> panel.
    </p>
  `;

  const wrappedHtml = wrapPilotHubEmailHtml(bodyHtml);
  const plain = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  return sendEmail({
    to: PILOTHUB_ADMIN_NOTIFICATION_EMAIL,
    subject: "New PilotHub Application Received!",
    html: wrappedHtml,
    text: `New PilotHub Application Received!\n\n${plain}\n\nReview: https://www.pilothub.vip/admin/applications`,
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
    <div style="color: #475569; line-height: 1.7; font-size: 15px;">
      ${textToEmailHtml(message)}
    </div>
  `;

  const wrappedHtml = wrapPilotHubEmailHtml(bodyHtml);

  return sendEmail({
    to,
    subject,
    html: wrappedHtml,
    text: `${subject}\n\n${message}\n\n— PilotHub by ChatPilot`,
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
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px; font-weight: 600;">ကြိုဆိုပါသည်, ${escapeHtml(name)}!</h2>
      <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
        သင်၏ PilotHub application ကို approved ပြုလုပ်ပြီးပါပြီ။
        ယခု <strong style="color: #0d9488;">free plan</strong> ဖြင့် စတင်စမ်းသပ်နိုင်ပြီး AI advisors များကို အသုံးပြုနိုင်ပါပြီ။
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <a href="${escapeHtml(loginUrl)}" style="display: inline-block; padding: 14px 28px; background-color: #0d9488; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 6px;">ဝင်ရောက်ပါ →</a>
          </td>
        </tr>
      </table>
      <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0 0 24px;">${escapeHtml(loginUrl)}</p>
      <div style="background: #f8fafc; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">ရရှိမည့် features (${escapeHtml(planName)})</p>
        <ul style="color: #475569; line-height: 2; margin: 0; padding-left: 20px;">
          <li><strong style="color: #0d9488;">BizPilot AI</strong> — Business strategy &amp; operations</li>
          <li><strong style="color: #d97706;">FounderPilot AI</strong> — Founder &amp; CEO advisory</li>
          <li>Myanmar business context နားလည်သော AI</li>
        </ul>
      </div>
      <p style="color: #64748b; font-size: 13px; margin: 24px 0 0; text-align: center;">
        မေးခွန်းများရှိပါက <a href="mailto:chatpilot.mm@gmail.com" style="color: #0d9488; text-decoration: none;">chatpilot.mm@gmail.com</a> သို့ ဆက်သွယ်ပါ
      </p>
  `;

  const wrappedHtml = wrapPilotHubEmailHtml(bodyHtml);

  return sendEmail({
    to,
    subject: `PilotHub Application Approved — ကြိုဆိုပါသည် ${name}!`,
    html: wrappedHtml,
    text: `ကြိုဆိုပါသည် ${name}!\n\nသင်၏ PilotHub application ကို approved ပြုလုပ်ပြီးပါပြီ။\nfree plan ဖြင့် စတင်စမ်းသပ်နိုင်ပြီး AI advisors များကို အသုံးပြုနိုင်ပါပြီ။\n\nဝင်ရောက်ပါ: ${loginUrl}\n\nPowered by ChatPilot`,
  });
}

export type PaymentSubmittedNotificationInput = {
  userName: string;
  userEmail: string;
  plan: string;
  amount: number;
  paymentMethod: string;
  transactionRef?: string | null;
};

/** Notify admin when a user submits a payment from the website. */
export async function sendNewPaymentSubmittedEmail(
  payment: PaymentSubmittedNotificationInput,
): Promise<boolean> {
  const rows = [
    ["Name", payment.userName],
    ["Email", payment.userEmail],
    ["Plan", payment.plan],
    ["Amount", `${payment.amount.toLocaleString()} MMK`],
    ["Payment Method", payment.paymentMethod],
    ["Transaction Ref", payment.transactionRef ?? "—"],
  ] as const;

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding: 10px 14px; color: #64748b; font-size: 13px; vertical-align: top; width: 140px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(label)}</td>
          <td style="padding: 10px 14px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const bodyHtml = `
    <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 20px; font-weight: 600;">New payment submitted</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
      ${tableRows}
    </table>
    <p style="color: #64748b; font-size: 13px; margin: 24px 0 0;">
      Review in the <a href="https://www.pilothub.vip/admin/payments" style="color: #0d9488; text-decoration: none;">Admin Payments</a> panel.
    </p>
  `;

  const wrappedHtml = wrapPilotHubEmailHtml(bodyHtml);
  const plain = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  return sendEmail({
    to: PILOTHUB_ADMIN_NOTIFICATION_EMAIL,
    subject: "New Payment Submitted!",
    html: wrappedHtml,
    text: `New Payment Submitted!\n\n${plain}\n\nReview: https://www.pilothub.vip/admin/payments`,
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
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px; font-weight: 600;">Payment Confirmed</h2>
      <p style="color: #475569; line-height: 1.7; margin: 0;">
        ${escapeHtml(name)} ၏ <strong style="color: #0d9488;">${escapeHtml(planName)}</strong> plan payment ကို confirmed ပြုလုပ်ပြီးပါပြီ။
        Subscription ကို activate ပြုလုပ်ပြီးပါပြီ။
      </p>
  `;

  const wrappedHtml = wrapPilotHubEmailHtml(bodyHtml);

  return sendEmail({
    to,
    subject: `PilotHub Payment Confirmed — ${planName} Plan`,
    html: wrappedHtml,
    text: `${name} ၏ ${planName} plan payment ကို confirmed ပြုလုပ်ပြီးပါပြီ။\n\nPowered by ChatPilot`,
  });
}
