import { sql } from "@/db";

export default async function MonitoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reports = await sql<{ kind: string; body: string; created_at: string }[]>`
    SELECT kind, body, created_at::text FROM project_reports WHERE project_id = ${id} ORDER BY created_at DESC
  `;
  return (
    <div className="panel">
      <p>Demo, usage evidence, financial reports, security checks. Outcomes: continue / pause / restructure / close.</p>
      {reports.map((r, i) => (
        <article key={i}>
          <h3>{r.kind}</h3>
          <p>{r.body}</p>
        </article>
      ))}
    </div>
  );
}
