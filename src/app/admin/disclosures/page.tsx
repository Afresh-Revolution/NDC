import { sql } from "@/db";

export const metadata = { title: "Disclosures" };

export default async function DisclosuresPage() {
  const rows = await sql<{ email: string; related_type: string; nature: string; recused: boolean }[]>`
    SELECT u.email, c.related_type, c.nature, c.recused
    FROM conflict_disclosures c JOIN users u ON u.id = c.user_id
    ORDER BY c.created_at DESC
  `;
  return (
    <>
      <p className="kicker">Conflicts</p>
      <h1>Related-party disclosures</h1>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Person</th><th>Type</th><th>Nature</th><th>Recused</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}><td>{r.email}</td><td>{r.related_type}</td><td>{r.nature}</td><td>{r.recused ? "yes" : "no"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
