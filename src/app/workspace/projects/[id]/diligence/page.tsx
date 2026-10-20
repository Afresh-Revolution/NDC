import { sql } from "@/db";

export default async function DiligencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reviews = await sql<{ kind: string; status: string; score: string | null; recused: boolean }[]>`
    SELECT kind, status::text, score::text, recused FROM diligence_reviews WHERE project_id = ${id}
  `;
  return (
    <div className="panel">
      <p>Technical diligence: architecture, security/data inventory, maintainability, delivery plan, key dependencies. Commercial diligence: pricing, acquisition, unit economics, procurement feasibility.</p>
      <p>Independent reviewers only. Related parties disclose and recuse.</p>
      {reviews.length === 0 ? <p>No independent reviews filed.</p> : (
        <ul>{reviews.map((r, i) => <li key={i}>{r.kind} · {r.status} · {r.score ?? "—"} {r.recused ? "(recused)" : ""}</li>)}</ul>
      )}
    </div>
  );
}
