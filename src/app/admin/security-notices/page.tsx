import { publishSecurityNotice } from "@/app/actions/admin";
import { sql } from "@/db";

export const metadata = { title: "Security notices" };

export default async function SecurityNoticesPage() {
  const rows = await sql<{ title: string; severity: string; body: string }[]>`
    SELECT title, severity, body FROM security_notices ORDER BY published_at DESC
  `;
  return (
    <>
      <p className="kicker">Trust</p>
      <h1>Security notices</h1>
      <form action={publishSecurityNotice} className="panel">
        <div className="field"><label>Title</label><input name="title" required /></div>
        <div className="field"><label>Severity</label>
          <select name="severity"><option>low</option><option>medium</option><option>high</option><option>critical</option></select>
        </div>
        <div className="field"><label>Audience</label><input name="audience" defaultValue="all" /></div>
        <div className="field"><label>Body</label><textarea name="body" rows={5} required /></div>
        <button className="btn" type="submit">Publish</button>
      </form>
      {rows.map((r, i) => <article className="panel" key={i} style={{ marginTop: "0.7rem" }}><span className="tag">{r.severity}</span><h3>{r.title}</h3><p>{r.body}</p></article>)}
    </>
  );
}
