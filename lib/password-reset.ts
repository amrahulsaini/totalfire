import crypto from "node:crypto";

export const PASSWORD_RESET_OTP_EXPIRY_MINUTES = 10;

export function generateSixDigitOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export function getOtpExpiryDate() {
  return new Date(Date.now() + PASSWORD_RESET_OTP_EXPIRY_MINUTES * 60 * 1000);
}

export function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) {
    return "***";
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
