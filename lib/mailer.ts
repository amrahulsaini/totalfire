import nodemailer from "nodemailer";

interface PasswordResetOtpEmailInput {
  to: string;
  username: string;
  otp: string;
  expiresInMinutes: number;
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || !Number.isFinite(port)) {
    throw new Error("SMTP credentials are missing or invalid");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
}

export async function sendPasswordResetOtpEmail(input: PasswordResetOtpEmailInput) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER must be configured");
  }

  const subject = "TotalFire Password Reset OTP";
  const text = [
    `Hi ${input.username},`,
    "",
    "Your TotalFire password reset OTP is:",
    input.otp,
    "",
    `This OTP expires in ${input.expiresInMinutes} minutes.`,
    "If you did not request this, you can safely ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">TotalFire Password Reset</h2>
      <p>Hi <strong>${input.username}</strong>,</p>
      <p>Your password reset OTP is:</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 10px 0 16px; color: #e63946;">
        ${input.otp}
      </div>
      <p>This OTP expires in <strong>${input.expiresInMinutes} minutes</strong>.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: input.to,
    subject,
    text,
    html,
  });
}
