import { saveProjectSection } from "@/app/actions/projects";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lines = await sql<{ line_item: string; amount_kobo: number; category: string }[]>`
    SELECT line_item, amount_kobo, category FROM project_budgets WHERE project_id = ${id}
  `;
  return (
    <>
      <form action={saveProjectSection} className="panel">
        <input type="hidden" name="projectId" value={id} />
        <input type="hidden" name="section" value="budget" />
        <p>Budget changes above policy tolerances require prior authorisation. This is a project budget, never a draw on member savings.</p>
        <div className="field"><label>Line item</label><input name="line" required /></div>
        <div className="field"><label>Amount (NGN)</label><input name="amount" type="number" min={0} step="0.01" required /></div>
        <div className="field"><label>Category</label><input name="category" defaultValue="build" /></div>
        <div className="field"><label>Notes</label><input name="notes" /></div>
        <button className="btn" type="submit">Add line</button>
      </form>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data">
          <thead><tr><th>Item</th><th>Category</th><th>Amount</th></tr></thead>
          <tbody>
            {lines.map((l, i) => <tr key={i}><td>{l.line_item}</td><td>{l.category}</td><td>{formatNgn(l.amount_kobo)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
