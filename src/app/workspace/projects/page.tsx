import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import Link from "next/link";

export const metadata = { title: "My projects" };

export default async function MyProjectsPage() {
  const user = await requireUser();
  const rows = await sql<{ id: string; title: string; stage: string; score_total: string | null }[]>`
    SELECT id, title, stage::text, score_total::text FROM project_submissions
    WHERE submitter_id = ${user.id}
       OR id IN (SELECT project_id FROM project_teams WHERE user_id = ${user.id})
    ORDER BY created_at DESC
  `;
  return (
    <>
      <p className="kicker">Incubator</p>
      <h1>Submitted products</h1>
      <p><Link href="/workspace/projects/new" className="btn">Create project</Link></p>
      {rows.length === 0 ? <div className="panel">No submissions yet.</div> : (
        <div className="table-wrap" style={{ marginTop: "1rem" }}>
          <table className="data">
            <thead><tr><th>Title</th><th>Stage</th><th>Score</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/workspace/projects/${r.id}`}>{r.title}</Link></td>
                  <td>{r.stage}</td>
                  <td>{r.score_total ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
