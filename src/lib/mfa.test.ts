import { describe, expect, it } from "vitest";
import { TOTP } from "otpauth";
import { acceptedTotpStep, consumeBackupCode, createTotp, generateBackupCodes, hashBackupCode } from "./mfa";

describe("totp", () => {
  it("accepts the current authenticator code and rejects a replay", () => {
    const totp = createTotp("admin@ndcnaija.org");
    const code = totp.generate();
    const step = acceptedTotpStep(totp.secret.base32, code, null);
    expect(step).not.toBeNull();
    expect(Math.abs((step ?? 0) - TOTP.counter())).toBeLessThanOrEqual(1);
    expect(acceptedTotpStep(totp.secret.base32, code, step)).toBeNull();
    expect(acceptedTotpStep(totp.secret.base32, "000000", null)).toBeNull();
  });
});

describe("backup codes", () => {
  it("issues unique codes and consumes one hash", () => {
    const codes = generateBackupCodes();
    expect(new Set(codes).size).toBe(8);
    const hashes = codes.map(hashBackupCode);
    const next = consumeBackupCode(hashes, codes[3].toLowerCase());
    expect(next).toHaveLength(7);
    expect(consumeBackupCode(next ?? [], codes[3])).toBeNull();
  });
});
