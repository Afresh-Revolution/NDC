import { addMilestone, decideFunding, signAgreement } from "@/app/actions/admin";
import { recuseFromProject as recuse, scoreProject } from "@/app/actions/projects";
import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { SCORE_THRESHOLD, SCORE_WEIGHTS } from "@/lib/funding";
import { notFound } from "next/navigation";

export default async function AdminProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const p = (await sql<{ title: string; problem_statement: string; submitter_id: string; stage: string; score_total: string | null }[]>`
    SELECT title, problem_statement, submitter_id, stage::text, score_total::text FROM project_submissions WHERE id = ${id}
  `)[0];
  if (!p) notFound();
  const own = p.submitter_id === user.id;
  const agreements = await sql<{ id: string; status: string }[]>`SELECT id, status FROM funding_agreements WHERE project_id = ${id}`;
  return (
    <>
      <p className="kicker">{p.stage}</p>
      <h1>{p.title}</h1>
      <div className="panel">
        <p>{p.problem_statement}</p>
        <p>Composite {p.score_total ?? "—"} (threshold {SCORE_THRESHOLD} for discussion only).</p>
        {own ? <p className="flash error">You cannot score or approve your own project.</p> : null}
      </div>
      {!own ? (
        <form action={scoreProject} className="panel" style={{ marginTop: "1rem" }}>
          <input type="hidden" name="projectId" value={id} />
          {SCORE_WEIGHTS.map((w) => (
            <div className="field" key={w.dimension}>
              <label>{w.label} ({w.weight}%)</label>
              <input name={w.dimension} type="number" min={0} max={100} defaultValue={0} />
              <input name={`${w.dimension}_ev`} placeholder="Evidence" />
            </div>
          ))}
          <button className="btn" type="submit">File independent score</button>
        </form>
      ) : null}
      <form action={recuse} className="panel" style={{ marginTop: "1rem" }}>
        <input type="hidden" name="projectId" value={id} />
        <div className="field"><label>Conflict nature</label><input name="nature" required /></div>
        <button className="btn ghost" type="submit">Disclose and recuse</button>
      </form>
      {!own ? (
        <form action={decideFunding} className="panel" style={{ marginTop: "1rem" }}>
          <input type="hidden" name="projectId" value={id} />
          <div className="field"><label>Instrument</label>
            <select name="instrument">
              <option value="microgrant">Non-dilutive microgrant</option>
              <option value="cloud_credits">Cloud credits</option>
              <option value="sponsorship">Maintenance sponsorship</option>
              <option value="loan" disabled>Loan (disabled until licensed)</option>
            </select>
          </div>
          <div className="field"><label>Amount NGN (from project development fund)</label><input name="amount" type="number" min={0} step="0.01" /></div>
          <div className="field"><label>Rationale</label><textarea name="rationale" rows={4} required /></div>
          <button className="btn" name="decision" value="approve">Independent approve</button>{" "}
          <button className="btn ghost" name="decision" value="revise">Revise</button>{" "}
          <button className="btn ghost" name="decision" value="reject">Reject</button>
        </form>
      ) : null}
      <form action={addMilestone} className="panel" style={{ marginTop: "1rem" }}>
        <input type="hidden" name="projectId" value={id} />
        <h3>Attach milestone</h3>
        <div className="field"><label>Title</label><input name="title" required /></div>
        <div className="field"><label>Acceptance tests</label><textarea name="tests" required /></div>
        <div className="field"><label>Amount NGN</label><input name="amount" type="number" min={0} step="0.01" required /></div>
        <div className="field"><label>Sequence</label><input name="sequence" type="number" defaultValue={1} /></div>
        <div className="field"><label>Due</label><input name="due" type="date" /></div>
        <button className="btn" type="submit">Add milestone</button>
      </form>
      {agreements.map((a) => (
        <form action={signAgreement} key={a.id} className="panel" style={{ marginTop: "0.6rem" }}>
          <input type="hidden" name="agreementId" value={a.id} />
          <p>Agreement {a.status}</p>
          <button className="btn small" type="submit">Countersign as NDC</button>
        </form>
      ))}
    </>
  );
}
