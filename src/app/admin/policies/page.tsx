import { sql } from "@/db";

export const metadata = { title: "Policies" };

export default async function PoliciesAdminPage() {
  const rows = await sql<{ slug: string; title: string; version: string; effective_at: string }[]>`
    SELECT slug, title, version, effective_at::text FROM policy_versions ORDER BY slug, effective_at DESC
  `;
  return (
    <>
      <p className="kicker">Instruments</p>
      <h1>Policy versions</h1>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Slug</th><th>Title</th><th>Version</th><th>Effective</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}><td className="mono">{r.slug}</td><td>{r.title}</td><td>{r.version}</td><td>{r.effective_at.slice(0, 10)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
