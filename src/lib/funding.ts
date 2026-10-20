import { sql } from "@/db";

export const SCORE_WEIGHTS = [
  { dimension: "customer_demand", weight: 25, label: "Customer problem and demand" },
  { dimension: "team_capacity", weight: 20, label: "Team capacity and technical delivery" },
  { dimension: "commercial_viability", weight: 20, label: "Commercial viability" },
  { dimension: "budget_milestones", weight: 15, label: "Delivery budget and milestones" },
  { dimension: "legal_security_ip", weight: 10, label: "Legal, security and IP readiness" },
  { dimension: "social_member_value", weight: 10, label: "Social / member value" },
] as const;

export const SCORE_THRESHOLD = 70;

export async function assertNotSelfReview(projectId: string, reviewerId: string) {
  const owners = await sql<{ user_id: string }[]>`
    SELECT submitter_id AS user_id FROM project_submissions WHERE id = ${projectId}
    UNION
    SELECT user_id FROM project_teams WHERE project_id = ${projectId}
    UNION
    SELECT user_id FROM founders WHERE project_id = ${projectId} AND user_id IS NOT NULL
  `;
  if (owners.some((o) => o.user_id === reviewerId)) {
    throw new Error("A proposer cannot review, score, or approve their own project.");
  }
  const conflicts = await sql<{ id: string }[]>`
    SELECT id FROM conflict_disclosures
    WHERE user_id = ${reviewerId} AND related_type = 'project' AND related_id = ${projectId} AND recused = true
  `;
  if (conflicts[0]) throw new Error("Reviewer has recused from this project.");
}

export function weightedTotal(
  scores: { dimension: string; score: number; weight_pct: number }[],
): number {
  return scores.reduce((sum, s) => sum + (Number(s.score) * Number(s.weight_pct)) / 100, 0);
}
