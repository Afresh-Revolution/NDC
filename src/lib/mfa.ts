import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";
import { env } from "@/lib/env";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createTotp(email: string, base32?: string) {
  const secret = base32 ? Secret.fromBase32(base32) : new Secret({ size: 20 });
  return new TOTP({
    issuer: env.appName || "NDC Naija",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
}

export function acceptedTotpStep(base32: string, code: string, lastStep: number | null): number | null {
  const token = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(token)) return null;
  const secret = Secret.fromBase32(base32);
  const timestamp = Date.now();
  const delta = TOTP.validate({
    token,
    secret,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    timestamp,
    window: 1,
  });
  if (delta === null) return null;
  const step = TOTP.counter({ timestamp }) + delta;
  if (lastStep != null && step <= lastStep) return null;
  return step;
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  while (codes.length < count) {
    let raw = "";
    while (raw.length < 10) {
      const bytes = randomBytes(16);
      for (const byte of bytes) {
        if (byte >= 256 - (256 % ALPHABET.length)) continue;
        raw += ALPHABET[byte % ALPHABET.length];
        if (raw.length === 10) break;
      }
    }
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

export function normalizeBackupCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

export function hashBackupCode(code: string): string {
  return createHash("sha256").update(normalizeBackupCode(code)).digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function consumeBackupCode(hashes: string[], code: string): string[] | null {
  const target = hashBackupCode(code);
  const index = hashes.findIndex((hash) => sameHash(hash, target));
  if (index < 0) return null;
  return hashes.filter((_, i) => i !== index);
}

export function pgTextArray(values: string[]): string {
  return `{${values.join(",")}}`;
}

export function asTextList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string" || value === "{}" || value === "") return [];
  const inner = value.replace(/^\{|\}$/g, "");
  if (!inner) return [];
  return inner.split(",").map((item) => item.replace(/^"|"$/g, "")).filter(Boolean);
}

export async function totpQrDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, { margin: 1, width: 220, errorCorrectionLevel: "M" });
}
