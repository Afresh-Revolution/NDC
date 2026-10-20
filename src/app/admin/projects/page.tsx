import { sql } from "@/db";
import Link from "next/link";

export const metadata = { title: "Project pipeline" };

export default async function AdminProjectsPage() {
  const rows = await sql<{ id: string; title: string; stage: string; score_total: string | null; email: string }[]>`
    SELECT p.id, p.title, p.stage::text, p.score_total::text, u.email
    FROM project_submissions p JOIN users u ON u.id = p.submitter_id
    ORDER BY p.created_at DESC
  `;
  return (
    <>
      <p className="kicker">Investment / project committee</p>
      <h1>Pipeline</h1>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Title</th><th>Founder</th><th>Stage</th><th>Score</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/projects/${r.id}`}>{r.title}</Link></td>
                <td>{r.email}</td>
                <td>{r.stage}</td>
                <td>{r.score_total ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
