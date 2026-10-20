import { saveProjectSection } from "@/app/actions/projects";

export default async function ValidationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <form action={saveProjectSection} className="panel">
      <input type="hidden" name="projectId" value={id} />
      <input type="hidden" name="section" value="validation" />
      <p>Required: customer interviews, competitor map, willingness-to-pay evidence, risk register. Decision: reject / revise / proceed.</p>
      <div className="field"><label>Validation evidence</label><textarea name="evidence" rows={8} required /></div>
      <button className="btn" type="submit">File validation pack</button>
    </form>
  );
}
