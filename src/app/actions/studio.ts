"use server";

import { redirect } from "next/navigation";
import { sql } from "@/db";
import { requireUser } from "@/app/actions/auth";
import { audit } from "@/lib/audit";
import { parseNairaInput } from "@/lib/money";

export async function applyToOpportunity(formData: FormData) {
  const user = await requireUser();
  const opportunityId = String(formData.get("opportunityId") ?? "");
  await sql`
    INSERT INTO matches (opportunity_id, user_id, status)
    VALUES (${opportunityId}, ${user.id}, 'applied')
    ON CONFLICT (opportunity_id, user_id) DO UPDATE SET status = 'applied'
  `;
  await audit({ actorId: user.id, action: "studio.apply", entity: "opportunities", entityId: opportunityId });
  redirect("/workspace/studio");
}

export async function submitProposal(formData: FormData) {
  const user = await requireUser();
  const amount = parseNairaInput(String(formData.get("amount") ?? "0"));
  const labour = parseNairaInput(String(formData.get("labour") ?? "0"));
  const margin = Math.max(amount - labour, 0);
  await sql`
    INSERT INTO proposals (opportunity_id, author_id, scope, amount_kobo, margin_kobo, status)
    VALUES (
      ${String(formData.get("opportunityId") ?? "")},
      ${user.id},
      ${String(formData.get("scope") ?? "")},
      ${amount},
      ${margin},
      'submitted'
    )
  `;
  redirect("/workspace/studio/proposals");
}

export async function logTime(formData: FormData) {
  const user = await requireUser();
  await sql`
    INSERT INTO timesheets (user_id, opportunity_id, work_date, minutes, notes)
    VALUES (
      ${user.id},
      ${String(formData.get("opportunityId") ?? "") || null},
      ${String(formData.get("date") ?? "")},
      ${Number(formData.get("minutes") ?? 0)},
      ${String(formData.get("notes") ?? "")}
    )
  `;
  redirect("/workspace/studio/timesheets");
}

export async function raiseDispute(formData: FormData) {
  const user = await requireUser();
  await sql`
    INSERT INTO studio_disputes (opportunity_id, raised_by, body, stage)
    VALUES (
      ${String(formData.get("opportunityId") ?? "") || null},
      ${user.id},
      ${String(formData.get("body") ?? "")},
      'project_lead'
    )
  `;
  redirect("/workspace/studio/disputes");
}
