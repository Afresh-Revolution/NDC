import { submitProposal } from "@/app/actions/studio";
import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Proposals" };

export default async function ProposalsPage() {
  const user = await requireUser();
  const opps = await sql<{ id: string; title: string }[]>`SELECT id, title FROM opportunities WHERE status = 'open'`;
  const mine = await sql<{ amount_kobo: number; margin_kobo: number; status: string }[]>`
    SELECT amount_kobo, margin_kobo, status FROM proposals WHERE author_id = ${user.id}
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Quotations include labour, QA, PM, tax, risk and margin</h1>
      <form action={submitProposal} className="panel">
        <div className="field"><label>Opportunity</label>
          <select name="opportunityId">{opps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>
        </div>
        <div className="field"><label>Scope</label><textarea name="scope" rows={5} required /></div>
        <div className="field"><label>Gross quote (NGN)</label><input name="amount" type="number" min={0} step="0.01" required /></div>
        <div className="field"><label>Developer labour (NGN)</label><input name="labour" type="number" min={0} step="0.01" required /></div>
        <button className="btn" type="submit">Submit proposal</button>
      </form>
      <p>Margin is recognised only as earned and cannot conceal deductions from developer pay.</p>
      <ul>{mine.map((m, i) => <li key={i}>{formatNgn(m.amount_kobo)} quote · margin {formatNgn(m.margin_kobo)} · {m.status}</li>)}</ul>
    </>
  );
}
