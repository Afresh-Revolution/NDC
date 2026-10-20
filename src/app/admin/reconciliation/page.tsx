import { recordReconciliation } from "@/app/actions/admin";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Reconciliation" };

export default async function ReconciliationPage() {
  const rows = await sql<{ provider: string; period_start: string; period_end: string; provider_total_kobo: string; ledger_total_kobo: string; status: string }[]>`
    SELECT provider, period_start::text, period_end::text, provider_total_kobo::text, ledger_total_kobo::text, status
    FROM reconciliations ORDER BY created_at DESC
  `;
  return (
    <>
      <p className="kicker">Finance</p>
      <h1>Gateway, bank and ledger</h1>
      <p>Posted entries are reversed, never silently edited. Quarterly reports must tie to these reconciliations.</p>
      <form action={recordReconciliation} className="panel">
        <div className="grid-2">
          <div className="field"><label>Provider</label><input name="provider" defaultValue="paystack" /></div>
          <div className="field"><label>Status notes</label><input name="notes" /></div>
          <div className="field"><label>Period start</label><input type="date" name="start" required /></div>
          <div className="field"><label>Period end</label><input type="date" name="end" required /></div>
          <div className="field"><label>Provider total NGN</label><input name="providerTotal" type="number" step="0.01" required /></div>
          <div className="field"><label>Ledger total NGN</label><input name="ledgerTotal" type="number" step="0.01" required /></div>
        </div>
        <button className="btn" type="submit">File reconciliation</button>
      </form>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data">
          <thead><tr><th>Provider</th><th>Period</th><th>Provider</th><th>Ledger</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.provider}</td><td>{r.period_start} → {r.period_end}</td>
                <td>{formatNgn(r.provider_total_kobo)}</td><td>{formatNgn(r.ledger_total_kobo)}</td><td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
