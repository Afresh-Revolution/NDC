"use server";

import { sql } from "@/db";
import { requireUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { randomToken, sha256 } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const first = String(formData.get("firstName") ?? "");
  const last = String(formData.get("lastName") ?? "");
  await sql`
    UPDATE profiles SET
      first_name = ${first},
      last_name = ${last},
      display_name = ${`${first} ${last}`.trim()},
      headline = ${String(formData.get("headline") ?? "")},
      city = ${String(formData.get("city") ?? "")},
      bio = ${String(formData.get("bio") ?? "")},
      updated_at = now()
    WHERE user_id = ${user.id}
  `;
  redirect("/workspace/profile");
}

export async function revokeSession(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await sql`UPDATE sessions SET revoked_at = now() WHERE id = ${id} AND user_id = ${user.id}`;
  await audit({ actorId: user.id, action: "session.revoke", entity: "sessions", entityId: id });
  redirect("/workspace/sessions");
}

export async function requestMyData() {
  const user = await requireUser();
  await sql`
    INSERT INTO data_requests (user_id, kind, status)
    VALUES (${user.id}, 'access', 'received')
  `;
  redirect("/workspace/data-rights?queued=1");
}

export async function disconnectOauth(formData: FormData) {
  const user = await requireUser();
  const provider = String(formData.get("provider") ?? "");
  await sql`DELETE FROM oauth_connections WHERE user_id = ${user.id} AND provider = ${provider}`;
  await audit({ actorId: user.id, action: "oauth.disconnect", entity: "oauth_connections", entityId: user.id, metadata: { provider } });
  redirect("/workspace/settings");
}

export async function createNoticeAck() {
  return randomToken(4);
}

export { sha256 };
