import { sql } from "@/db";

export const metadata = { title: "Complaints" };

export default async function ComplaintsPage() {
  const rows = await sql<{ body: string; status: string; created_at: string }[]>`
    SELECT body, status, created_at::text FROM complaints ORDER BY created_at DESC
  `;
  return (
    <>
      <p className="kicker">Ethics</p>
      <h1>Complaints</h1>
      <div className="panel">{rows.length === 0 ? "No complaints." : rows.map((r, i) => <p key={i}>{r.status}: {r.body}</p>)}</div>
    </>
  );
}
