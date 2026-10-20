"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/db";
import { safeNext } from "@/app/actions/auth";
import { currentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { decrypt, encrypt, verifyPassword } from "@/lib/crypto";
import { env } from "@/lib/env";
import { createTotp, generateBackupCodes, hashBackupCode, pgTextArray } from "@/lib/mfa";
import { verifyAndConsumeMfa } from "@/lib/mfa-user";

const FLASH = "ndc_mfa_backup";

function backupCookie(codes: string[]) {
  return encrypt(JSON.stringify(codes));
}

export async function beginMfaSetup() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.mfaEnabled) redirect("/workspace/settings");
  const totp = createTotp(user.email);
  await sql`
    UPDATE users
    SET mfa_secret = ${encrypt(totp.secret.base32)}, mfa_enabled = false, mfa_backup_codes = NULL, mfa_last_step = NULL
    WHERE id = ${user.id} AND mfa_enabled = false
  `;
  redirect("/workspace/settings");
}

export async function confirmMfaSetup(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.mfaEnabled) redirect("/workspace/settings");
  const rows = await sql<{ mfa_secret: string | null }[]>`
    SELECT mfa_secret FROM users WHERE id = ${user.id}
  `;
  const stored = rows[0]?.mfa_secret;
  if (!stored) redirect("/workspace/settings?mfa=missing");
  let base32 = "";
  try {
    base32 = decrypt(stored);
  } catch {
    redirect("/workspace/settings?mfa=missing");
  }
  const totp = createTotp(user.email, base32);
  const timestamp = Date.now();
  const delta = totp.validate({ token: String(formData.get("code") ?? "").replace(/\s+/g, ""), timestamp, window: 1 });
  if (delta === null) redirect("/workspace/settings?mfa=invalid");
  const accepted = totp.counter({ timestamp }) + delta;
  const codes = generateBackupCodes();
  await sql`
    UPDATE users
    SET mfa_enabled = true,
        mfa_backup_codes = ${pgTextArray(codes.map(hashBackupCode))}::text[],
        mfa_last_step = ${accepted}
    WHERE id = ${user.id} AND mfa_enabled = false
  `;
  await sql`
    UPDATE sessions SET mfa_verified_at = NULL
    WHERE user_id = ${user.id} AND token_hash <> ${user.sessionHash}
  `;
  await sql`UPDATE sessions SET mfa_verified_at = now() WHERE token_hash = ${user.sessionHash}`;
  const jar = await cookies();
  jar.set(FLASH, backupCookie(codes), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  await audit({ actorId: user.id, action: "auth.mfa_enable", entity: "users", entityId: user.id });
  redirect("/workspace/settings?enrolled=1");
}

export async function dismissBackupCodes() {
  const jar = await cookies();
  jar.delete(FLASH);
  redirect("/workspace/settings");
}

export async function disableMfa(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const rows = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM users WHERE id = ${user.id}
  `;
  const passwordOk = rows[0] ? await verifyPassword(String(formData.get("password") ?? ""), rows[0].password_hash) : false;
  if (!passwordOk) redirect("/workspace/settings?mfa=invalid");
  const codeOk = await verifyAndConsumeMfa(user.id, String(formData.get("code") ?? ""));
  if (!codeOk) redirect("/workspace/settings?mfa=invalid");
  await sql`
    UPDATE users
    SET mfa_enabled = false, mfa_secret = NULL, mfa_backup_codes = NULL, mfa_last_step = NULL
    WHERE id = ${user.id}
  `;
  await audit({ actorId: user.id, action: "auth.mfa_disable", entity: "users", entityId: user.id });
  redirect("/workspace/settings?mfa=off");
}

export async function verifyMfaAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const dest = safeNext(String(formData.get("next") ?? "/workspace"));
  if (!user.mfaEnabled) redirect(dest);
  const ok = await verifyAndConsumeMfa(user.id, String(formData.get("code") ?? ""));
  if (!ok) redirect(`/login/mfa?error=1&next=${encodeURIComponent(dest)}`);
  await sql`UPDATE sessions SET mfa_verified_at = now() WHERE token_hash = ${user.sessionHash}`;
  await audit({ actorId: user.id, action: "auth.mfa", entity: "sessions", entityId: user.id });
  redirect(dest);
}
