import { saveProjectSection } from "@/app/actions/projects";
import { sql } from "@/db";

export default async function CanvasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = (await sql<{ market_hypothesis: string | null }[]>`SELECT market_hypothesis FROM project_submissions WHERE id = ${id}`)[0];
  return (
    <form action={saveProjectSection} className="panel">
      <input type="hidden" name="projectId" value={id} />
      <input type="hidden" name="section" value="canvas" />
      <p>Lean canvas: customer, problem, alternatives, unfair advantage, channels, cost, revenue hypothesis.</p>
      <div className="field"><label>Market hypothesis</label><textarea name="market" rows={8} defaultValue={p?.market_hypothesis ?? ""} /></div>
      <button className="btn" type="submit">Save canvas</button>
    </form>
  );
}
