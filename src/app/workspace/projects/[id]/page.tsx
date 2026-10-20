import { sql } from "@/db";
import { notFound } from "next/navigation";
import { saveProjectSection } from "@/app/actions/projects";

export default async function ProjectOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = (await sql<{
    problem_statement: string;
    target_users: string;
    originality_declaration: string | null;
    project_type: string;
    score_total: string | null;
  }[]>`
    SELECT problem_statement, target_users, originality_declaration, project_type::text, score_total::text
    FROM project_submissions WHERE id = ${id}
  `)[0];
  if (!p) notFound();
  return (
    <div className="panel">
      <p><strong>Type.</strong> {p.project_type}</p>
      <p><strong>Problem.</strong> {p.problem_statement}</p>
      <p><strong>Users.</strong> {p.target_users}</p>
      <p><strong>Originality.</strong> {p.originality_declaration}</p>
      <p><strong>Composite score.</strong> {p.score_total ?? "unscored"} / 100 — a high score is not an entitlement to money.</p>
      <form action={saveProjectSection}>
        <input type="hidden" name="projectId" value={id} />
        <input type="hidden" name="section" value="advance" />
        <input type="hidden" name="stage" value="validation" />
        <button className="btn small" type="submit">Advance to validation</button>
      </form>
    </div>
  );
}
