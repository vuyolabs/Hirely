import "server-only";

import nodemailer from "nodemailer";

async function getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        return nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });
    }

    // Development fallback: Ethereal catches the mail and gives a preview URL.
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
    });
}

export async function sendPasswordResetEmail(
    email: string,
    code: string,
    resetUrl: string | null,
    expiresInMinutes: number
) {
    const transporter = await getTransporter();
    const from = process.env.SMTP_FROM?.trim() || `"Hirely" <noreply@hirely.com>`;

    const button = resetUrl
        ? `
            <tr><td style="padding:8px 0 4px;">
                <a href="${resetUrl}" style="display:inline-block;background:#007a7e;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:999px;">
                    Reset password
                </a>
            </td></tr>
            <tr><td style="padding:12px 0 0;color:#71717a;font-size:12px;line-height:1.5;">
                Or enter the code on the reset page.
            </td></tr>`
        : "";

    const info = await transporter.sendMail({
        from,
        to: email,
        subject: `${code} is your Hirely password reset code`,
        text: [
            "We received a request to reset your Hirely password.",
            "",
            `Your code: ${code}`,
            resetUrl ? `Or open: ${resetUrl}` : "",
            "",
            `The code expires in ${expiresInMinutes} minutes. If you didn't ask for this, you can ignore this email — your password won't change.`,
        ].join("\n"),
        html: `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px;">
      <tr><td style="font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#18181b;padding-bottom:24px;">
        <span style="display:inline-block;width:22px;height:22px;border-radius:6px;background:#007a7e;vertical-align:-4px;margin-right:6px;"></span>Hirely
      </td></tr>
      <tr><td style="font-size:22px;font-weight:700;color:#18181b;padding-bottom:8px;">Reset your password</td></tr>
      <tr><td style="font-size:14px;line-height:1.6;color:#52525b;padding-bottom:20px;">
        We received a request to reset the password for <strong>${email}</strong>. Use this code:
      </td></tr>
      <tr><td style="padding-bottom:20px;">
        <div style="background:#e7faf9;border:1px solid #b8e9e8;border-radius:12px;padding:16px;text-align:center;font-family:SFMono-Regular,Consolas,monospace;font-size:30px;font-weight:700;letter-spacing:10px;color:#004d51;">
          ${code}
        </div>
      </td></tr>
      ${button}
      <tr><td style="border-top:1px solid #f4f4f5;margin-top:24px;padding-top:20px;color:#a1a1aa;font-size:12px;line-height:1.6;">
        This code expires in ${expiresInMinutes} minutes. If you didn't request a reset, ignore this email — your password won't change. Never share this code with anyone.
      </td></tr>
    </table>
  </td></tr>
</table>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
        console.log(`[mail] Ethereal preview for password reset: ${previewUrl}`);
    }

    return info;
}
