import { saveProjectSection } from "@/app/actions/projects";
import { sql } from "@/db";

export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decls = await sql<{ arrangement: string; statement: string }[]>`
    SELECT arrangement, statement FROM ownership_declarations WHERE project_id = ${id}
  `;
  const ag = await sql<{ status: string }[]>`SELECT status FROM funding_agreements WHERE project_id = ${id}`;
  return (
    <>
      <form action={saveProjectSection} className="panel">
        <input type="hidden" name="projectId" value={id} />
        <input type="hidden" name="section" value="ip" />
        <p>Default treatments: pre-existing founder IP stays with the founder; grants do not automatically transfer ownership; loans do not themselves confer equity; joint studio products need a JV agreement.</p>
        <div className="field">
          <label>Arrangement</label>
          <select name="arrangement">
            <option value="pre_existing">Pre-existing founder IP</option>
            <option value="grant">Grant-funded</option>
            <option value="loan">Loan-supported</option>
            <option value="joint_studio">Joint studio product</option>
            <option value="client">Client commission</option>
            <option value="oss">Open-source contribution</option>
          </select>
        </div>
        <div className="field"><label>Background IP schedule</label><textarea name="background" rows={4} /></div>
        <div className="field"><label>Declaration</label><textarea name="statement" rows={4} required /></div>
        <button className="btn" type="submit">Record ownership declaration</button>
      </form>
      <ul>
        {decls.map((d, i) => <li key={i}>{d.arrangement}: {d.statement}</li>)}
      </ul>
      <p>Agreement status: {ag[0]?.status ?? "none on file"}</p>
    </>
  );
}
