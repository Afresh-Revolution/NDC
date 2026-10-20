import { requestDisbursement } from "@/app/actions/projects";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export default async function MilestonesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql<{ id: string; title: string; amount_kobo: number; status: string; acceptance_tests: string }[]>`
    SELECT id, title, amount_kobo, status, acceptance_tests FROM milestones WHERE project_id = ${id} ORDER BY sequence
  `;
  return (
    <div className="panel">
      <p>Staged disbursement with unique references. Retry never duplicates. Feature-flagged off until a signed agreement and dual approvals exist.</p>
      {rows.length === 0 ? <p>No milestones yet. The funding committee attaches them after independent approval.</p> : rows.map((m) => (
        <form action={requestDisbursement} key={m.id} style={{ marginBottom: "1rem" }}>
          <input type="hidden" name="milestoneId" value={m.id} />
          <h3>{m.title} · {formatNgn(m.amount_kobo)}</h3>
          <p>{m.acceptance_tests}</p>
          <p className="tag">{m.status}</p>
          <button className="btn small" type="submit">Request milestone payout</button>
        </form>
      ))}
    </div>
  );
}
