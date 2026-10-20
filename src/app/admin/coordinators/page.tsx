import { sql } from "@/db";

export const metadata = { title: "Coordinators" };

export default async function CoordinatorsPage() {
  const rows = await sql<{ name: string; email: string | null; state_code: string }[]>`
    SELECT c.name, u.email, c.state_code
    FROM chapters c
    LEFT JOIN users u ON u.id = c.coordinator_user_id
    ORDER BY c.name
  `;
  return (
    <>
      <p className="kicker">Chapter</p>
      <h1>State coordinators</h1>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Chapter</th><th>Code</th><th>Coordinator</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.state_code}><td>{r.name}</td><td>{r.state_code}</td><td>{r.email ?? "unassigned"}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
