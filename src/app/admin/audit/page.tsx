import { sql } from "@/db";

export const metadata = { title: "Audit log" };

export default async function AuditPage() {
  const rows = await sql<{ action: string; entity: string; created_at: string; actor: string | null }[]>`
    SELECT a.action, a.entity, a.created_at::text, u.email AS actor
    FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
    ORDER BY a.created_at DESC LIMIT 200
  `;
  return (
    <>
      <p className="kicker">Privileged actions</p>
      <h1>Audit log</h1>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}><td className="mono">{r.created_at.slice(0, 19)}</td><td>{r.actor}</td><td>{r.action}</td><td>{r.entity}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
