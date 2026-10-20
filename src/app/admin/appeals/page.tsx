import { decideAppeal } from "@/app/actions/admin";
import { sql } from "@/db";

export const metadata = { title: "Appeals" };

export default async function AppealsPage() {
  const rows = await sql<{ id: string; body: string; status: string; related_type: string }[]>`
    SELECT id, body, status, related_type FROM appeals ORDER BY created_at DESC
  `;
  return (
    <>
      <p className="kicker">Independent review</p>
      <h1>Appeals</h1>
      {rows.length === 0 ? <div className="panel">No appeals.</div> : rows.map((a) => (
        <form action={decideAppeal} key={a.id} className="panel" style={{ marginBottom: "0.7rem" }}>
          <input type="hidden" name="id" value={a.id} />
          <p>{a.related_type} · {a.status}</p>
          <p>{a.body}</p>
          <div className="field"><label>Decision</label><textarea name="decision" required /></div>
          <button className="btn" type="submit">Record decision</button>
        </form>
      ))}
    </>
  );
}
