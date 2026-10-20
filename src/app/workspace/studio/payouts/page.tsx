import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Payouts" };

export default async function PayoutsPage() {
  const user = await requireUser();
  const rows = await sql<{ amount_kobo: number; status: string; paid_at: string | null }[]>`
    SELECT amount_kobo, status, paid_at::text FROM contractor_payables WHERE user_id = ${user.id}
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Contractor settlement</h1>
      <p>Members receive contracted compensation first under agreed schedules. Cooperative margin is recognised only as earned.</p>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Amount</th><th>Status</th><th>Paid</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={3}>No payables.</td></tr> : rows.map((r, i) => (
              <tr key={i}><td>{formatNgn(r.amount_kobo)}</td><td>{r.status}</td><td>{r.paid_at ?? "—"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
