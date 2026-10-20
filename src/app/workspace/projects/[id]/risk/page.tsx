import { saveProjectSection } from "@/app/actions/projects";
import { sql } from "@/db";

export default async function RiskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const risks = await sql<{ title: string; likelihood: string; impact: string; status: string }[]>`
    SELECT title, likelihood, impact, status FROM project_risks WHERE project_id = ${id}
  `;
  return (
    <>
      <form action={saveProjectSection} className="panel">
        <input type="hidden" name="projectId" value={id} />
        <input type="hidden" name="section" value="risk" />
        <div className="field"><label>Risk</label><input name="title" required /></div>
        <div className="grid-2">
          <div className="field"><label>Likelihood</label><select name="likelihood"><option>low</option><option>medium</option><option>high</option></select></div>
          <div className="field"><label>Impact</label><select name="impact"><option>low</option><option>medium</option><option>high</option></select></div>
        </div>
        <div className="field"><label>Mitigation</label><textarea name="mitigation" rows={3} /></div>
        <button className="btn" type="submit">Add risk</button>
      </form>
      <ul>{risks.map((r, i) => <li key={i}>{r.title} · {r.likelihood}/{r.impact} · {r.status}</li>)}</ul>
    </>
  );
}
