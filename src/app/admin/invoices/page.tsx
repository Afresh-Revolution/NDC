import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Invoices" };

export default async function AdminInvoicesPage() {
  const rows = await sql<{ reference: string; kind: string; amount_kobo: number; status: string; email: string }[]>`
    SELECT i.reference, i.kind, i.amount_kobo, i.status, u.email
    FROM contribution_invoices i JOIN users u ON u.id = i.user_id
    ORDER BY i.created_at DESC LIMIT 100
  `;
  return (
    <>
      <p className="kicker">Finance</p>
      <h1>Invoices</h1>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Reference</th><th>Member</th><th>Kind</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.reference}><td className="mono">{r.reference}</td><td>{r.email}</td><td>{r.kind}</td><td>{formatNgn(r.amount_kobo)}</td><td>{r.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
