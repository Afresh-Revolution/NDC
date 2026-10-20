import { applyToOpportunity } from "@/app/actions/studio";
import { sql } from "@/db";

export const metadata = { title: "Studio application" };

export default async function StudioApplyPage() {
  const rows = await sql<{ id: string; title: string; brief: string }[]>`
    SELECT id, title, brief FROM opportunities WHERE status = 'open' ORDER BY created_at DESC
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Apply to a brief</h1>
      <p>Application is skill-matched. It is not a job guarantee.</p>
      {rows.length === 0 ? (
        <div className="panel">No open briefs. Watch the opportunity board.</div>
      ) : (
        rows.map((r) => (
          <form action={applyToOpportunity} key={r.id} className="panel" style={{ marginBottom: "0.8rem" }}>
            <input type="hidden" name="opportunityId" value={r.id} />
            <h3>{r.title}</h3>
            <p>{r.brief}</p>
            <button className="btn" type="submit">Submit application</button>
          </form>
        ))
      )}
    </>
  );
}
