import { randomInt } from "crypto";

export function normalizeMobile(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }

  return digits;
}

export function isValidMobile(input: string): boolean {
  const mobile = normalizeMobile(input);
  return /^\d{10}$/.test(mobile);
}

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}
