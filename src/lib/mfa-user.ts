import { sql } from "@/db";
import { decrypt } from "@/lib/crypto";
import { acceptedTotpStep, asTextList, consumeBackupCode, pgTextArray } from "@/lib/mfa";

type MfaRow = {
  mfa_secret: string | null;
  mfa_backup_codes: unknown;
  mfa_last_step: string | null;
};

async function loadMfa(userId: string) {
  const rows = await sql<MfaRow[]>`
    SELECT mfa_secret, mfa_backup_codes, mfa_last_step::text
    FROM users WHERE id = ${userId}
  `;
  return rows[0] ?? null;
}

export async function verifyAndConsumeMfa(userId: string, code: string): Promise<boolean> {
  const row = await loadMfa(userId);
  if (!row?.mfa_secret) return false;
  let base32 = "";
  try {
    base32 = decrypt(row.mfa_secret);
  } catch {
    return false;
  }
  const last = row.mfa_last_step == null ? null : Number(row.mfa_last_step);
  const step = acceptedTotpStep(base32, code, Number.isFinite(last) ? last : null);
  if (step != null) {
    const updated = await sql<{ id: string }[]>`
      UPDATE users SET mfa_last_step = ${step}
      WHERE id = ${userId} AND (mfa_last_step IS NULL OR mfa_last_step < ${step})
      RETURNING id
    `;
    return updated.length > 0;
  }
  const next = consumeBackupCode(asTextList(row.mfa_backup_codes), code);
  if (!next) return false;
  const updated = await sql<{ id: string }[]>`
    UPDATE users SET mfa_backup_codes = ${pgTextArray(next)}::text[]
    WHERE id = ${userId}
    RETURNING id
  `;
  return updated.length > 0;
}
