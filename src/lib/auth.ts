import { cookies, headers } from "next/headers";
import { sql } from "@/db";
import { env } from "@/lib/env";
import { hashPassword, randomToken, sha256, verifyPassword } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "ndc_session";
const encoder = new TextEncoder();

export type AuthUser = {
  id: string;
  email: string;
  status: string;
  mfaEnabled: boolean;
  displayName: string;
  membershipClass: string | null;
  membershipStatus: string | null;
  roles: string[];
  permissions: string[];
  chapterId: string | null;
};

export async function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const passwordHash = await hashPassword(input.password);
  const [user] = await sql<{ id: string }[]>`
    INSERT INTO users (email, phone, password_hash, status)
    VALUES (${input.email.toLowerCase()}, ${input.phone ?? null}, ${passwordHash}, 'pending')
    RETURNING id
  `;
  const display = `${input.firstName} ${input.lastName}`.trim();
  await sql`
    INSERT INTO profiles (user_id, first_name, last_name, display_name)
    VALUES (${user.id}, ${input.firstName}, ${input.lastName}, ${display})
  `;
  await sql`INSERT INTO developer_profiles (user_id) VALUES (${user.id})`;
  const memberRole = await sql<{ id: string }[]>`SELECT id FROM roles WHERE slug = 'member' LIMIT 1`;
  if (memberRole[0]) {
    await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${user.id}, ${memberRole[0].id}) ON CONFLICT DO NOTHING`;
  }
  await sql`
    INSERT INTO memberships (user_id, class, status)
    VALUES (${user.id}, 'full_professional', 'draft')
  `;
  await audit({ actorId: user.id, action: "user.register", entity: "users", entityId: user.id });
  return user.id;
}

export async function authenticate(email: string, password: string) {
  const rows = await sql<{ id: string; password_hash: string; status: string; mfa_enabled: boolean }[]>`
    SELECT id, password_hash, status, mfa_enabled FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
  `;
  const user = rows[0];
  if (!user) return null;
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return null;
  if (user.status === "suspended") throw new Error("Account suspended");
  return user;
}

export async function createSession(userId: string, opts?: { mfaVerified?: boolean }) {
  const raw = randomToken(32);
  const tokenHash = sha256(raw);
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  const h = await headers();
  await sql`
    INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at, mfa_verified_at)
    VALUES (
      ${userId},
      ${tokenHash},
      ${h.get("user-agent")},
      ${h.get("x-forwarded-for")},
      ${expires},
      ${opts?.mfaVerified ? new Date() : null}
    )
  `;
  await sql`UPDATE users SET last_login_at = now() WHERE id = ${userId}`;
  const jwt = await new SignJWT({ sub: userId, sid: tokenHash })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("14d")
    .sign(encoder.encode(env.authSecret));
  const jar = await cookies();
  jar.set(COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
    expires,
  });
  return raw;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, encoder.encode(env.authSecret));
      await sql`UPDATE sessions SET revoked_at = now() WHERE token_hash = ${String(payload.sid)}`;
    } catch {
      /* ignore */
    }
  }
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(env.authSecret));
    const sid = String(payload.sid ?? "");
    const sessions = await sql<{ user_id: string }[]>`
      SELECT user_id FROM sessions
      WHERE token_hash = ${sid}
        AND revoked_at IS NULL
        AND expires_at > now()
      LIMIT 1
    `;
    if (!sessions[0]) return null;
    return loadUser(sessions[0].user_id);
  } catch {
    return null;
  }
}

export async function loadUser(userId: string): Promise<AuthUser | null> {
  const rows = await sql<{
    id: string;
    email: string;
    status: string;
    mfa_enabled: boolean;
    display_name: string | null;
    chapter_id: string | null;
    class: string | null;
    membership_status: string | null;
  }[]>`
    SELECT u.id, u.email, u.status, u.mfa_enabled,
           p.display_name, p.chapter_id, m.class::text, m.status::text AS membership_status
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT class, status FROM memberships WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
    ) m ON true
    WHERE u.id = ${userId}
  `;
  const u = rows[0];
  if (!u) return null;
  const roles = await sql<{ slug: string }[]>`
    SELECT r.slug FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ${userId}
  `;
  const permissions = await sql<{ slug: string }[]>`
    SELECT DISTINCT p.slug
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId}
  `;
  return {
    id: u.id,
    email: u.email,
    status: u.status,
    mfaEnabled: u.mfa_enabled,
    displayName: u.display_name ?? u.email,
    membershipClass: u.class,
    membershipStatus: u.membership_status,
    roles: roles.map((r) => r.slug),
    permissions: permissions.map((p) => p.slug),
    chapterId: u.chapter_id,
  };
}

export function hasRole(user: AuthUser | null, ...slugs: string[]) {
  if (!user) return false;
  return slugs.some((s) => user.roles.includes(s));
}

export function can(user: AuthUser | null, permission: string) {
  if (!user) return false;
  if (user.roles.includes("super_admin")) return true;
  return user.permissions.includes(permission);
}

export function isStaff(user: AuthUser | null) {
  return hasRole(user, "super_admin", "admin", "board", "secretariat", "finance_audit", "ethics");
}

export function isAdmin(user: AuthUser | null) {
  return hasRole(user, "super_admin", "admin");
}

export function requirePermission(user: AuthUser | null, permission: string) {
  if (!can(user, permission)) {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}
