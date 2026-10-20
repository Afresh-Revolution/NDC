import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";

export const metadata = { title: "Notices" };

export default async function NoticesPage() {
  const user = await requireUser();
  const rows = await sql<{ title: string; body: string; kind: string; created_at: string }[]>`
    SELECT title, body, kind, created_at::text FROM notices
    WHERE user_id = ${user.id} OR user_id IS NULL
    ORDER BY created_at DESC
  `;
  return (
    <>
      <p className="kicker">Notices</p>
      <h1>Official correspondence</h1>
      {rows.length === 0 ? <div className="panel">No notices.</div> : rows.map((n, i) => (
        <article className="panel" key={i} style={{ marginBottom: "0.7rem" }}>
          <span className="tag">{n.kind}</span>
          <h3>{n.title}</h3>
          <p>{n.body}</p>
        </article>
      ))}
    </>
  );
}
