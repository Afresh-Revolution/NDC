"use server";

import { redirect } from "next/navigation";
import { sql } from "@/db";
import { requireUser } from "@/app/actions/auth";
import { audit } from "@/lib/audit";
import { SCORE_WEIGHTS, assertNotSelfReview, weightedTotal } from "@/lib/funding";
import { flagEnabled } from "@/lib/flags";
import { randomToken } from "@/lib/crypto";

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const problem = String(formData.get("problem") ?? "").trim();
  const users = String(formData.get("targetUsers") ?? "").trim();
  const type = String(formData.get("projectType") ?? "prototype_mvp");
  const originality = String(formData.get("originality") ?? "");
  if (!title || !problem || !users) throw new Error("Complete the submission fields");
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48) + "-" + randomToken(3);
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO project_submissions (
      slug, title, problem_statement, target_users, originality_declaration,
      project_type, submitter_id, market_hypothesis
    ) VALUES (
      ${slug}, ${title}, ${problem}, ${users}, ${originality},
      ${type}::project_type, ${user.id}, ${String(formData.get("market") ?? "")}
    )
    RETURNING id
  `;
  await sql`
    INSERT INTO founders (project_id, user_id, full_name, role, is_submitter)
    VALUES (${row.id}, ${user.id}, ${user.displayName}, 'founder', true)
  `;
  await sql`
    INSERT INTO project_teams (project_id, user_id, role, allocation_pct)
    VALUES (${row.id}, ${user.id}, 'submitter', 100)
  `;
  await audit({ actorId: user.id, action: "project.create", entity: "project_submissions", entityId: row.id });
  redirect(`/workspace/projects/${row.id}`);
}

export async function saveProjectSection(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("projectId") ?? "");
  await assertOwner(id, user.id);
  const section = String(formData.get("section") ?? "");
  if (section === "canvas") {
    await sql`UPDATE project_submissions SET market_hypothesis = ${String(formData.get("market") ?? "")}, updated_at = now() WHERE id = ${id}`;
  }
  if (section === "validation") {
    await sql`UPDATE project_submissions SET stage = 'validation', updated_at = now() WHERE id = ${id}`;
    await sql`
      INSERT INTO project_reports (project_id, kind, body, submitted_by)
      VALUES (${id}, 'validation', ${String(formData.get("evidence") ?? "")}, ${user.id})
    `;
  }
  if (section === "ip") {
    await sql`
      INSERT INTO ownership_declarations (project_id, arrangement, background_ip, statement, signed_by)
      VALUES (
        ${id},
        ${String(formData.get("arrangement") ?? "pre_existing")},
        ${String(formData.get("background") ?? "")},
        ${String(formData.get("statement") ?? "")},
        ${user.id}
      )
    `;
  }
  if (section === "budget") {
    await sql`
      INSERT INTO project_budgets (project_id, line_item, amount_kobo, category, notes)
      VALUES (
        ${id},
        ${String(formData.get("line") ?? "")},
        ${Math.round(Number(formData.get("amount") ?? 0) * 100)},
        ${String(formData.get("category") ?? "build")},
        ${String(formData.get("notes") ?? "")}
      )
    `;
  }
  if (section === "repo") {
    await sql`
      INSERT INTO repos (project_id, user_id, provider, url, visibility)
      VALUES (
        ${id}, ${user.id}, ${String(formData.get("provider") ?? "github")},
        ${String(formData.get("url") ?? "")}, ${String(formData.get("visibility") ?? "private")}
      )
    `;
  }
  if (section === "team") {
    const email = String(formData.get("email") ?? "").toLowerCase();
    const member = (await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`)[0];
    if (member) {
      await sql`
        INSERT INTO project_teams (project_id, user_id, role)
        VALUES (${id}, ${member.id}, ${String(formData.get("role") ?? "contributor")})
      `;
    }
  }
  if (section === "risk") {
    await sql`
      INSERT INTO project_risks (project_id, title, likelihood, impact, mitigation)
      VALUES (
        ${id},
        ${String(formData.get("title") ?? "")},
        ${String(formData.get("likelihood") ?? "medium")},
        ${String(formData.get("impact") ?? "medium")},
        ${String(formData.get("mitigation") ?? "")}
      )
    `;
  }
  if (section === "advance") {
    const stage = String(formData.get("stage") ?? "validation");
    await sql`UPDATE project_submissions SET stage = ${stage}::project_stage, updated_at = now() WHERE id = ${id}`;
  }
  redirect(`/workspace/projects/${id}/${section === "advance" ? "" : section}`);
}

export async function scoreProject(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("projectId") ?? "");
  await assertNotSelfReview(id, user.id);
  for (const dim of SCORE_WEIGHTS) {
    const score = Number(formData.get(dim.dimension) ?? 0);
    await sql`
      INSERT INTO project_scores (project_id, reviewer_id, dimension, weight_pct, score, evidence)
      VALUES (${id}, ${user.id}, ${dim.dimension}, ${dim.weight}, ${score}, ${String(formData.get(`${dim.dimension}_ev`) ?? "")})
      ON CONFLICT (project_id, reviewer_id, dimension)
      DO UPDATE SET score = excluded.score, evidence = excluded.evidence
    `;
  }
  const scores = await sql<{ dimension: string; score: number; weight_pct: number }[]>`
    SELECT dimension, score, weight_pct FROM project_scores WHERE project_id = ${id} AND reviewer_id = ${user.id}
  `;
  const total = weightedTotal(scores);
  await sql`
    INSERT INTO diligence_reviews (project_id, reviewer_id, kind, status, score)
    VALUES (${id}, ${user.id}, 'composite', 'completed', ${total})
    ON CONFLICT (project_id, reviewer_id, kind)
    DO UPDATE SET score = excluded.score, status = 'completed'
  `;
  await sql`UPDATE project_submissions SET score_total = ${total} WHERE id = ${id}`;
  await audit({ actorId: user.id, action: "project.score", entity: "project_submissions", entityId: id, metadata: { total } });
  redirect(`/admin/projects/${id}`);
}

export async function recuseFromProject(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("projectId") ?? "");
  await sql`
    INSERT INTO conflict_disclosures (user_id, related_type, related_id, nature, recused)
    VALUES (${user.id}, 'project', ${id}, ${String(formData.get("nature") ?? "related party")}, true)
  `;
  redirect(`/admin/projects/${id}`);
}

export async function requestDisbursement(formData: FormData) {
  const user = await requireUser();
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const enabled = await flagEnabled("disbursement");
  if (!enabled) throw new Error("Milestone disbursement is disabled until legal and board approvals.");
  const ms = (await sql<{ id: string; project_id: string; amount_kobo: number; status: string }[]>`
    SELECT id, project_id, amount_kobo, status FROM milestones WHERE id = ${milestoneId}
  `)[0];
  if (!ms) throw new Error("Milestone not found");
  const agreement = (await sql<{ id: string }[]>`
    SELECT id FROM funding_agreements WHERE project_id = ${ms.project_id} AND status = 'signed' LIMIT 1
  `)[0];
  if (!agreement) throw new Error("Milestone payout cannot execute without a signed agreement");
  const ref = `NDC-DISB-${randomToken(5)}`;
  await sql`
    INSERT INTO disbursements (milestone_id, project_id, amount_kobo, unique_reference, idempotency_key, status)
    VALUES (${ms.id}, ${ms.project_id}, ${ms.amount_kobo}, ${ref}, ${`disb:${ms.id}`}, 'pending')
    ON CONFLICT (idempotency_key) DO NOTHING
  `;
  await audit({ actorId: user.id, action: "disbursement.request", entity: "disbursements", entityId: ms.id });
  redirect(`/workspace/projects/${ms.project_id}/milestones`);
}

async function assertOwner(projectId: string, userId: string) {
  const row = (await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM project_submissions
    WHERE id = ${projectId} AND (
      submitter_id = ${userId}
      OR id IN (SELECT project_id FROM project_teams WHERE user_id = ${userId})
    )
  `)[0];
  if (!row?.n) throw new Error("Forbidden");
}
