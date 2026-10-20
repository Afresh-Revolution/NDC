"use server";

import { redirect } from "next/navigation";
import { sql } from "@/db";
import { requireUser } from "@/app/actions/auth";
import { can, requirePermission } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { memberSavingsBalance, postJournal } from "@/lib/ledger";
import { assertNotSelfReview } from "@/lib/funding";
import { flagEnabled } from "@/lib/flags";
import { randomToken } from "@/lib/crypto";
import { verifyAndConsumeMfa } from "@/lib/mfa-user";

async function staff() {
  const user = await requireUser();
  if (!can(user, "members.read") && !user.roles.includes("super_admin")) {
    redirect("/workspace");
  }
  return user;
}

export async function decideMembership(formData: FormData) {
  const user = await staff();
  requirePermission(user, "members.verify");
  const id = String(formData.get("membershipId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (decision === "approve") {
    const card = `NDC-${randomToken(4).slice(0, 8).toUpperCase()}`;
    const mem = (await sql<{ user_id: string }[]>`SELECT user_id FROM memberships WHERE id = ${id}`)[0];
    await sql`
      UPDATE memberships SET status = 'active', approved_by = ${user.id}, approved_at = now(), joined_at = now(), denial_reason = null
      WHERE id = ${id}
    `;
    await sql`UPDATE users SET status = 'active', email_verified_at = COALESCE(email_verified_at, now()) WHERE id = ${mem.user_id}`;
    await sql`UPDATE profiles SET digital_card_number = COALESCE(digital_card_number, ${card}) WHERE user_id = ${mem.user_id}`;
    await sql`
      INSERT INTO notices (user_id, title, body, kind)
      VALUES (${mem.user_id}, 'Membership approved', 'Your digital member card has been issued.', 'success')
    `;
  } else {
    const mem = (await sql<{ user_id: string }[]>`SELECT user_id FROM memberships WHERE id = ${id}`)[0];
    await sql`
      UPDATE memberships SET status = 'denied', denial_reason = ${reason || "Not stated"}, approved_by = ${user.id}
      WHERE id = ${id}
    `;
    await sql`
      INSERT INTO notices (user_id, title, body, kind)
      VALUES (${mem.user_id}, 'Membership denied', ${reason || "A stated reason is required. You may appeal."}, 'warning')
    `;
  }
  await audit({ actorId: user.id, action: `membership.${decision}`, entity: "memberships", entityId: id, metadata: { reason } });
  redirect("/admin/verification");
}

export async function assignRole(formData: FormData) {
  const user = await staff();
  requirePermission(user, "governance.roles");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const slug = String(formData.get("role") ?? "");
  const target = (await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`)[0];
  const role = (await sql<{ id: string }[]>`SELECT id FROM roles WHERE slug = ${slug}`)[0];
  if (!target || !role) throw new Error("Unknown user or role");
  await sql`
    INSERT INTO user_roles (user_id, role_id, granted_by) VALUES (${target.id}, ${role.id}, ${user.id})
    ON CONFLICT DO NOTHING
  `;
  await audit({ actorId: user.id, action: "role.grant", entity: "users", entityId: target.id, metadata: { slug } });
  redirect("/admin/permissions");
}

export async function assignCommittee(formData: FormData) {
  const user = await staff();
  requirePermission(user, "governance.committees");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const slug = String(formData.get("committee") ?? "");
  const target = (await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`)[0];
  const c = (await sql<{ id: string }[]>`SELECT id FROM committees WHERE slug = ${slug}`)[0];
  if (!target || !c) throw new Error("Unknown");
  await sql`
    INSERT INTO committee_assignments (committee_id, user_id, title)
    VALUES (${c.id}, ${target.id}, ${String(formData.get("title") ?? "member")})
    ON CONFLICT DO NOTHING
  `;
  redirect("/admin/committees");
}

export async function approveWithdrawal(formData: FormData) {
  const user = await staff();
  requirePermission(user, "finance.withdraw.approve");
  if (!user.mfaEnabled && process.env.NODE_ENV === "production") {
    throw new Error("Step-up MFA is required for payout approvers");
  }
  if (user.mfaEnabled) {
    const ok = await verifyAndConsumeMfa(user.id, String(formData.get("code") ?? ""));
    if (!ok) throw new Error("Authenticator code is required");
  }
  const id = String(formData.get("id") ?? "");
  const slot = String(formData.get("slot") ?? "one");
  const w = (await sql<{
    user_id: string;
    amount_kobo: number;
    status: string;
    approver_one: string | null;
    second_approver: string | null;
  }[]>`
    SELECT user_id, amount_kobo, status, approved_by AS approver_one, second_approver
    FROM withdrawals WHERE id = ${id}
  `)[0];
  if (!w) throw new Error("Not found");
  if (slot === "one") {
    await sql`UPDATE withdrawals SET approved_by = ${user.id}, status = 'first_approval' WHERE id = ${id}`;
  } else {
    if (!w.approver_one || w.approver_one === user.id) {
      throw new Error("Dual control: a second independent approver is required");
    }
    const bal = await memberSavingsBalance(w.user_id);
    if (BigInt(w.amount_kobo) > bal) throw new Error("Insufficient savings claim");
    const posted = await postJournal({
      memo: `Savings withdrawal ${id}`,
      source: "withdrawal",
      sourceId: id,
      idempotencyKey: `withdrawal:${id}`,
      postedBy: user.id,
      lines: [
        { accountCode: "2100", debitKobo: w.amount_kobo, memberId: w.user_id, fundPoolKind: "member_savings", description: "Reduce savings liability" },
        { accountCode: "1100", creditKobo: w.amount_kobo, fundPoolKind: "member_savings", description: "Cash payout" },
      ],
    });
    await sql`
      UPDATE withdrawals
      SET second_approver = ${user.id}, status = 'paid', processed_at = now(), journal_entry_id = ${posted.id}, payout_ref = ${`WD-${id.slice(0, 8)}`}
      WHERE id = ${id}
    `;
  }
  await audit({ actorId: user.id, action: "withdrawal.approve", entity: "withdrawals", entityId: id, metadata: { slot } });
  redirect("/admin/savings");
}

export async function recordReconciliation(formData: FormData) {
  const user = await staff();
  requirePermission(user, "finance.reconcile");
  await sql`
    INSERT INTO reconciliations (provider, period_start, period_end, provider_total_kobo, ledger_total_kobo, status, notes, created_by)
    VALUES (
      ${String(formData.get("provider") ?? "paystack")},
      ${String(formData.get("start") ?? "")},
      ${String(formData.get("end") ?? "")},
      ${Math.round(Number(formData.get("providerTotal") ?? 0) * 100)},
      ${Math.round(Number(formData.get("ledgerTotal") ?? 0) * 100)},
      'draft',
      ${String(formData.get("notes") ?? "")},
      ${user.id}
    )
  `;
  redirect("/admin/reconciliation");
}

export async function decideFunding(formData: FormData) {
  const user = await staff();
  requirePermission(user, "projects.decide");
  const projectId = String(formData.get("projectId") ?? "");
  await assertNotSelfReview(projectId, user.id);
  const decision = String(formData.get("decision") ?? "revise");
  const [round] = await sql<{ id: string }[]>`
    INSERT INTO funding_rounds (project_id, instrument, requested_kobo, status, source_pool)
    VALUES (
      ${projectId},
      ${String(formData.get("instrument") ?? "microgrant")},
      ${Math.round(Number(formData.get("amount") ?? 0) * 100)},
      ${decision},
      'project_development'
    )
    RETURNING id
  `;
  await sql`
    INSERT INTO funding_decisions (round_id, decided_by, decision, rationale)
    VALUES (${round.id}, ${user.id}, ${decision}, ${String(formData.get("rationale") ?? "")})
  `;
  const stage = decision === "approve" ? "funding_committee" : decision === "reject" ? "rejected" : "validation";
  await sql`UPDATE project_submissions SET stage = ${stage}::project_stage WHERE id = ${projectId}`;
  if (decision === "approve") {
    await sql`
      INSERT INTO funding_agreements (project_id, round_id, status)
      VALUES (${projectId}, ${round.id}, 'draft')
    `;
  }
  await audit({ actorId: user.id, action: "funding.decide", entity: "project_submissions", entityId: projectId, metadata: { decision } });
  redirect(`/admin/projects/${projectId}`);
}

export async function signAgreement(formData: FormData) {
  const user = await staff();
  const id = String(formData.get("agreementId") ?? "");
  await sql`
    UPDATE funding_agreements SET status = 'signed', signed_by_ndc = ${user.id}, signed_at = now()
    WHERE id = ${id}
  `;
  redirect("/admin/projects");
}

export async function addMilestone(formData: FormData) {
  const user = await staff();
  const projectId = String(formData.get("projectId") ?? "");
  await sql`
    INSERT INTO milestones (project_id, title, acceptance_tests, amount_kobo, sequence, due_at)
    VALUES (
      ${projectId},
      ${String(formData.get("title") ?? "")},
      ${String(formData.get("tests") ?? "")},
      ${Math.round(Number(formData.get("amount") ?? 0) * 100)},
      ${Number(formData.get("sequence") ?? 1)},
      ${String(formData.get("due") ?? "") || null}
    )
  `;
  await audit({ actorId: user.id, action: "milestone.add", entity: "project_submissions", entityId: projectId });
  redirect(`/admin/projects/${projectId}`);
}

export async function issueSanction(formData: FormData) {
  const user = await staff();
  requirePermission(user, "members.sanction");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const target = (await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`)[0];
  if (!target) throw new Error("Unknown member");
  await sql`
    INSERT INTO sanctions (user_id, reason, action, issued_by)
    VALUES (${target.id}, ${String(formData.get("reason") ?? "")}, ${String(formData.get("action") ?? "warning")}, ${user.id})
  `;
  redirect("/admin/sanctions");
}

export async function toggleFlag(formData: FormData) {
  const user = await staff();
  requirePermission(user, "flags.manage");
  const key = String(formData.get("key") ?? "");
  if (["loans", "investment", "public_equity_portal"].includes(key)) {
    const enabled = await flagEnabled(key);
    if (!enabled && formData.get("enabled") === "on") {
      throw new Error("Legal launch gates still block this flag. Obtain counsel and board approval first.");
    }
  }
  const enabled = formData.get("enabled") === "on";
  await sql`UPDATE feature_flags SET enabled = ${enabled} WHERE key = ${key}`;
  await audit({ actorId: user.id, action: "flag.toggle", entity: "feature_flags", entityId: null, metadata: { key, enabled } });
  redirect("/admin/flags");
}

export async function resolveTicket(formData: FormData) {
  const user = await staff();
  requirePermission(user, "support.handle");
  await sql`UPDATE support_tickets SET status = ${String(formData.get("status") ?? "resolved")}::ticket_status WHERE id = ${String(formData.get("id") ?? "")}`;
  redirect("/admin/tickets");
}

export async function decideAppeal(formData: FormData) {
  const user = await staff();
  requirePermission(user, "support.handle");
  await sql`
    UPDATE appeals SET status = 'decided', decision = ${String(formData.get("decision") ?? "")}
    WHERE id = ${String(formData.get("id") ?? "")}
  `;
  await audit({ actorId: user.id, action: "appeal.decide", entity: "appeals", entityId: String(formData.get("id")) });
  redirect("/admin/appeals");
}

export async function publishSecurityNotice(formData: FormData) {
  const user = await staff();
  await sql`
    INSERT INTO security_notices (title, body, severity, audience, published_at)
    VALUES (
      ${String(formData.get("title") ?? "")},
      ${String(formData.get("body") ?? "")},
      ${String(formData.get("severity") ?? "medium")},
      ${String(formData.get("audience") ?? "all")},
      now()
    )
  `;
  await audit({ actorId: user.id, action: "security.notice", entity: "security_notices" });
  redirect("/admin/security-notices");
}

export async function createStudioOpportunity(formData: FormData) {
  const user = await staff();
  requirePermission(user, "studio.manage");
  await sql`
    INSERT INTO opportunities (title, brief, owner_id, status, is_public, budget_kobo)
    VALUES (
      ${String(formData.get("title") ?? "")},
      ${String(formData.get("brief") ?? "")},
      ${user.id},
      'open',
      ${formData.get("isPublic") === "on"},
      ${Math.round(Number(formData.get("budget") ?? 0) * 100) || null}
    )
  `;
  redirect("/admin");
}
