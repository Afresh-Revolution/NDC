import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";
import Link from "next/link";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await requireUser();
  const invoices = await sql<{ reference: string; kind: string; amount_kobo: number; status: string; created_at: string }[]>`
    SELECT reference, kind, amount_kobo, status, created_at::text FROM contribution_invoices
    WHERE user_id = ${user.id} ORDER BY created_at DESC
  `;
  return (
    <>
      <p className="kicker">Billing</p>
      <h1>Invoices and processor intents</h1>
      <p className="muted">Membership dues are billed on the <Link href="/workspace/membership">membership page</Link>.</p>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Reference</th><th>Kind</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.reference}>
                <td className="mono">{i.reference}</td>
                <td>{i.kind}</td>
                <td>{formatNgn(i.amount_kobo)}</td>
                <td>{i.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
