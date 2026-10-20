import { sql } from "@/db";

export default async function DeliverablesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tests = await sql<{ description: string; passed: boolean | null }[]>`
    SELECT a.description, a.passed FROM acceptance_tests a
    JOIN milestones m ON m.id = a.milestone_id WHERE m.project_id = ${id}
  `;
  return (
    <div className="panel">
      <p>Milestone acceptance tests and evidence. Funded products need security and licensing checks before release.</p>
      {tests.length === 0 ? <p>No acceptance tests filed.</p> : (
        <ul>{tests.map((t, i) => <li key={i}>{t.description} — {t.passed == null ? "pending" : t.passed ? "passed" : "failed"}</li>)}</ul>
      )}
    </div>
  );
}
