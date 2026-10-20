"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { sql } from "@/db";
import { authenticate, createSession, createUser, currentUser, destroySession } from "@/lib/auth";
import { randomToken, sha256 } from "@/lib/crypto";
import { sendMail, transactionalHtml } from "@/lib/mail";
import { env } from "@/lib/env";
import { audit } from "@/lib/audit";

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(10),
  membershipClass: z.enum(["full_professional", "associate_student", "corporate_partner"]),
});

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    membershipClass: formData.get("membershipClass") || "full_professional",
  });
  if (!parsed.success) throw new Error("Check the form and try again.");
  const id = await createUser(parsed.data);
  await sql`
    UPDATE memberships SET class = ${parsed.data.membershipClass}::membership_class
    WHERE user_id = ${id}
  `;
  if (parsed.data.membershipClass === "associate_student") {
    const role = await sql<{ id: string }[]>`SELECT id FROM roles WHERE slug = 'associate' LIMIT 1`;
    if (role[0]) {
      await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${id}, ${role[0].id}) ON CONFLICT DO NOTHING`;
    }
  }
  const raw = randomToken();
  await sql`
    INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at)
    VALUES (${id}, 'verify_email', ${sha256(raw)}, ${new Date(Date.now() + 1000 * 60 * 60 * 24)})
  `;
  await sendMail(
    parsed.data.email,
    "Verify your NDC Naija contact",
    transactionalHtml(
      "Verify your email",
      `<p>Confirm this address to continue onboarding.</p><p><a href="${env.appUrl}/verify?token=${raw}">Verify contact</a></p>`,
    ),
  );
  await createSession(id);
  redirect("/verify");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/workspace");
  try {
    const user = await authenticate(email, password);
    if (!user) throw new Error("Invalid credentials");
    await createSession(user.id, { mfaVerified: !user.mfa_enabled });
    await audit({ actorId: user.id, action: "auth.login", entity: "sessions", entityId: user.id });
    if (user.mfa_enabled) redirect("/login/mfa");
    redirect(next.startsWith("/") ? next : "/workspace");
  } catch (err) {
    if (typeof err === "object" && err && "digest" in err) throw err;
    redirect("/login?error=1");
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function verifyEmailAction(token: string) {
  const hash = sha256(token);
  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id FROM email_tokens
    WHERE token_hash = ${hash} AND purpose = 'verify_email' AND used_at IS NULL AND expires_at > now()
    LIMIT 1
  `;
  if (!rows[0]) throw new Error("Invalid or expired token");
  await sql`UPDATE users SET email_verified_at = now() WHERE id = ${rows[0].user_id}`;
  await sql`UPDATE email_tokens SET used_at = now() WHERE token_hash = ${hash}`;
}

export async function requestResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const users = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`;
  if (users[0]) {
    const raw = randomToken();
    await sql`
      INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at)
      VALUES (${users[0].id}, 'reset', ${sha256(raw)}, ${new Date(Date.now() + 1000 * 60 * 30)})
    `;
    await sendMail(
      email,
      "Reset your NDC password",
      transactionalHtml("Password reset", `<p><a href="${env.appUrl}/reset?token=${raw}">Choose a new password</a> (30 minutes).</p>`),
    );
  }
  redirect("/reset?sent=1");
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
