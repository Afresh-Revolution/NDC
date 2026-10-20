import { sql } from "@/db";

export const metadata = { title: "Jobs" };

export default async function JobsPage() {
  const rows = await sql<{ name: string; status: string; run_at: string; last_error: string | null }[]>`
    SELECT name, status, run_at::text, last_error FROM jobs ORDER BY run_at DESC LIMIT 50
  `;
  return (
    <>
      <p className="kicker">Workers</p>
      <h1>Background jobs</h1>
      <div className="panel">{rows.length === 0 ? "Queue empty." : rows.map((r, i) => <p key={i}>{r.name} · {r.status} · {r.last_error}</p>)}</div>
    </>
  );
}
