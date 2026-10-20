import { sql } from "@/db";

export const metadata = { title: "Data requests" };

export default async function AdminDataRequestsPage() {
  const rows = await sql<{ email: string; kind: string; status: string; created_at: string }[]>`
    SELECT u.email, d.kind, d.status, d.created_at::text
    FROM data_requests d JOIN users u ON u.id = d.user_id
    ORDER BY d.created_at DESC
  `;
  return (
    <>
      <p className="kicker">NDPA</p>
      <h1>Subject-right requests</h1>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Member</th><th>Kind</th><th>Status</th><th>When</th></tr></thead>
          <tbody>
            {rows.map((r, i) => <tr key={i}><td>{r.email}</td><td>{r.kind}</td><td>{r.status}</td><td>{r.created_at.slice(0, 19)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
