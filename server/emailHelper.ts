import nodemailer from "nodemailer";

/**
 * Send an email via Gmail SMTP.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD environment variables.
 * Gmail App Password: https://myaccount.google.com/apppasswords
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
  const user = process.env.GMAIL_USER;
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
      from: `"PilotHub" <${user}>`,
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
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a1628; color: #e2e8f0; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #0f1f35; border-radius: 16px; overflow: hidden; border: 1px solid #1e3a5f;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f2a1e 0%, #0a1628 100%); padding: 32px 40px; text-align: center; border-bottom: 1px solid #1e3a5f;">
      <h1 style="color: #22c55e; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">PILOTHUB</h1>
      <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">by ChatPilot</p>
    </div>
    <!-- Body -->
    <div style="padding: 40px;">
      <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px;">ကြိုဆိုပါသည်, ${name}!</h2>
      <p style="color: #94a3b8; line-height: 1.7; margin: 0 0 24px;">
        သင်၏ PilotHub application ကို approved ပြုလုပ်ပြီးပါပြီ။ 
        ယခု <strong style="color: #22c55e;">free plan</strong> ဖြင့် စတင်စမ်းသပ်နိုင်ပြီး AI advisors များကို အသုံးပြုနိုင်ပါပြီ။
      </p>
      <!-- Login URL as plain green text -->
      <div style="text-align: center; margin: 32px 0;">
        <p style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 0;">https://pilothub.vip သို့ ဝင်ရောက်ပါ</p>
      </div>
      <!-- Features -->
      <div style="background: #0a1628; border-radius: 12px; padding: 24px; border: 1px solid #1e3a5f;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">ရရှိမည့် features</p>
        <ul style="color: #94a3b8; line-height: 2; margin: 0; padding-left: 20px;">
          <li><strong style="color: #22c55e;">BizPilot AI</strong> — Business strategy & operations (Free: စာ ၅ ကြောင်း)</li>
          <li><strong style="color: #f59e0b;">FounderPilot AI</strong> — Founder & CEO advisory (Free: စာ ၅ ကြောင်း)</li>
          <li>Myanmar business context နားလည်သော AI</li>
          <li>အနာဂတ်တွင် ထွက်ရှိမည့် AI models အသစ်များကို <strong style="color: #22c55e;">Early Access</strong> ဖြင့် မြည်းစမ်းခွင့် ရရှိမည်</li>
          <li>Conversation history သိမ်းဆည်းနိုင်</li>
        </ul>
      </div>
      <p style="color: #475569; font-size: 13px; margin: 24px 0 0; text-align: center;">
        မေးခွန်းများရှိပါက <a href="mailto:chatpilot.mm@gmail.com" style="color: #22c55e;">chatpilot.mm@gmail.com</a> သို့ ဆက်သွယ်ပါ
      </p>
    </div>
    <!-- Footer -->
    <div style="padding: 20px 40px; border-top: 1px solid #1e3a5f; text-align: center;">
      <p style="color: #334155; font-size: 12px; margin: 0;">Powered by ChatPilot · Myanmar Business AI Platform</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `✅ PilotHub Application Approved — ကြိုဆိုပါသည် ${name}!`,
    html,
    text: `ကြိုဆိုပါသည် ${name}!\n\nသင်၏ PilotHub application ကို approved ပြုလုပ်ပြီးပါပြီ။\nfree plan ဖြင့် စတင်စမ်းသပ်နိုင်ပြီး AI advisors များကို အသုံးပြုနိုင်ပါပြီ။\n\nhttps://pilothub.vip သို့ ဝင်ရောက်ပါ\n\nPowered by ChatPilot`,
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
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a1628; color: #e2e8f0; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #0f1f35; border-radius: 16px; overflow: hidden; border: 1px solid #1e3a5f;">
    <div style="background: linear-gradient(135deg, #0f2a1e 0%, #0a1628 100%); padding: 32px 40px; text-align: center; border-bottom: 1px solid #1e3a5f;">
      <h1 style="color: #22c55e; font-size: 28px; font-weight: 800; margin: 0;">PILOTHUB</h1>
      <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">by ChatPilot</p>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px;">💳 Payment Confirmed!</h2>
      <p style="color: #94a3b8; line-height: 1.7;">
        ${name} ၏ <strong style="color: #22c55e;">${planName}</strong> plan payment ကို confirmed ပြုလုပ်ပြီးပါပြီ။
        Subscription ကို activate ပြုလုပ်ပြီးပါပြီ။
      </p>
      <p style="color: #475569; font-size: 13px; margin: 24px 0 0; text-align: center;">
        Powered by ChatPilot · Myanmar Business AI Platform
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `✅ PilotHub Payment Confirmed — ${planName} Plan`,
    html,
    text: `${name} ၏ ${planName} plan payment ကို confirmed ပြုလုပ်ပြီးပါပြီ။\n\nPowered by ChatPilot`,
  });
}
