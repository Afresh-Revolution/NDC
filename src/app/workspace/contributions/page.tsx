import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { requestContributionInvoice, simulatePayment } from "@/app/actions/finance";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Contributions" };

export default async function ContributionsPage() {
  const user = await requireUser();
  const open = await sql<{ id: string; reference: string; amount_kobo: number }[]>`
    SELECT id, reference, amount_kobo FROM contribution_invoices
    WHERE user_id = ${user.id} AND kind = 'monthly_savings' AND status = 'open'
  `;
  return (
    <>
      <p className="kicker">Contributions</p>
      <h1>Monthly savings are your claim</h1>
      <p>They are not operating revenue, grants, or risk capital. Tiers are member-approved; this form records an amount you choose until a schedule is adopted.</p>
      <form action={requestContributionInvoice} className="panel" style={{ marginBottom: "1rem" }}>
        <div className="field"><label>Amount (NGN)</label><input name="amount" type="number" min={1} step="0.01" required /></div>
        <button className="btn" type="submit">Generate invoice</button>
      </form>
      {open.map((i) => (
        <form action={simulatePayment} key={i.id} className="panel" style={{ marginBottom: "0.6rem" }}>
          <input type="hidden" name="invoiceId" value={i.id} />
          <p>{i.reference} · {formatNgn(i.amount_kobo)}</p>
          <button className="btn small" type="submit">Simulate verified webhook posting (sandbox)</button>
        </form>
      ))}
    </>
  );
}
