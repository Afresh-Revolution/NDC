import { sql } from "@/db";

export const metadata = { title: "RFPs" };

export default async function RfpsPage() {
  const rows = await sql<{ id: string; status: string; due_at: string | null }[]>`
    SELECT id, status, due_at::text FROM rfps ORDER BY due_at
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Requests for proposal</h1>
      <div className="panel">
        {rows.length === 0 ? <p>No RFPs in flight.</p> : rows.map((r) => <p key={r.id}>{r.status} · due {r.due_at ?? "—"}</p>)}
      </div>
    </>
  );
}
