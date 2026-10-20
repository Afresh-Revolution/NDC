"use server";

import { redirect } from "next/navigation";
import { sql } from "@/db";
import { requireUser } from "@/app/actions/auth";
import { randomToken } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export async function saveIdentity(formData: FormData) {
  const user = await requireUser();
  const idType = String(formData.get("idType") ?? "");
  await sql`
    INSERT INTO identities (user_id, id_type, status)
    VALUES (${user.id}, ${idType}, 'pending')
  `;
  await sql`
    UPDATE profiles SET city = ${String(formData.get("city") ?? "")},
      state_code = ${String(formData.get("state") ?? "")}
    WHERE user_id = ${user.id}
  `;
  const chapter = await sql<{ id: string }[]>`
    SELECT id FROM chapters WHERE state_code = ${String(formData.get("state") ?? "")} LIMIT 1
  `;
  if (chapter[0]) {
    await sql`UPDATE profiles SET chapter_id = ${chapter[0].id} WHERE user_id = ${user.id}`;
  }
  redirect("/onboarding/skills");
}

export async function saveSkills(formData: FormData) {
  const user = await requireUser();
  const discipline = String(formData.get("discipline") ?? "");
  const seniority = String(formData.get("seniority") ?? "");
  const years = Number(formData.get("years") ?? 0);
  await sql`
    UPDATE developer_profiles
    SET discipline = ${discipline}, seniority = ${seniority}, years_experience = ${years}
    WHERE user_id = ${user.id}
  `;
  const skillIds = formData.getAll("skill").map(String);
  await sql`DELETE FROM member_skills WHERE user_id = ${user.id}`;
  for (const id of skillIds) {
    await sql`
      INSERT INTO member_skills (user_id, skill_id, level)
      VALUES (${user.id}, ${id}, 'intermediate')
      ON CONFLICT DO NOTHING
    `;
  }
  redirect("/onboarding/portfolio");
}

export async function savePortfolio(formData: FormData) {
  const user = await requireUser();
  await sql`
    INSERT INTO portfolios (user_id, title, url, description, kind)
    VALUES (
      ${user.id},
      ${String(formData.get("title") ?? "Portfolio evidence")},
      ${String(formData.get("url") ?? "") || null},
      ${String(formData.get("description") ?? "")},
      ${String(formData.get("kind") ?? "project")}
    )
  `;
  await sql`
    UPDATE developer_profiles
    SET github_url = ${String(formData.get("github") ?? "") || null},
        gitlab_url = ${String(formData.get("gitlab") ?? "") || null},
        website_url = ${String(formData.get("website") ?? "") || null}
    WHERE user_id = ${user.id}
  `;
  redirect("/onboarding/declarations");
}

export async function acceptDeclarations(formData: FormData) {
  const user = await requireUser();
  const required = ["code-of-conduct", "bylaws", "funding-risk", "privacy", "ip-commitment"];
  for (const slug of required) {
    if (formData.get(slug) !== "on") throw new Error(`You must accept ${slug}`);
    const policy = await sql<{ id: string }[]>`
      SELECT id FROM policy_versions WHERE slug = ${slug} AND published = true ORDER BY effective_at DESC LIMIT 1
    `;
    if (policy[0]) {
      await sql`
        INSERT INTO consents (user_id, policy_version_id)
        VALUES (${user.id}, ${policy[0].id})
      `;
    }
  }
  redirect("/onboarding/payment");
}

export async function startMembershipPayment() {
  const user = await requireUser();
  const reference = `NDC-MEM-${randomToken(6)}`;
  const amount = 0;
  await sql`
    INSERT INTO contribution_invoices (user_id, kind, amount_kobo, status, reference, description)
    VALUES (
      ${user.id},
      'registration',
      ${Math.max(amount, 100)},
      'open',
      ${reference},
      'Membership application fee — amount pending board-approved schedule. Sandbox placeholder ₦1.00 until fees are adopted.'
    )
  `;
  await sql`
    UPDATE memberships SET status = 'payment_pending' WHERE user_id = ${user.id} AND status IN ('draft', 'submitted')
  `;
  await audit({ actorId: user.id, action: "membership.invoice", entity: "contribution_invoices", entityId: user.id });
  redirect("/onboarding/status");
}

export async function fileAppeal(formData: FormData) {
  const user = await requireUser();
  const membership = (await sql<{ id: string }[]>`
    SELECT id FROM memberships WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
  `)[0];
  await sql`
    INSERT INTO appeals (user_id, related_type, related_id, body, status)
    VALUES (${user.id}, 'membership', ${membership?.id ?? user.id}, ${String(formData.get("body") ?? "")}, 'open')
  `;
  await sql`UPDATE memberships SET status = 'appealing' WHERE user_id = ${user.id} AND status = 'denied'`;
  redirect("/onboarding/status");
}

export async function submitApplication() {
  const user = await requireUser();
  await sql`
    UPDATE memberships
    SET status = 'under_review', application_note = 'Submitted via onboarding'
    WHERE user_id = ${user.id}
  `;
  await audit({ actorId: user.id, action: "membership.submit", entity: "memberships", entityId: user.id });
  redirect("/onboarding/status");
}
