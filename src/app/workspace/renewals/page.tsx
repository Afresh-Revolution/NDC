import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Renewals" };

export default async function RenewalsPage() {
  const user = await requireUser();
  const rows = await sql<{ period_start: string; period_end: string; amount_kobo: number; status: string; grace_until: string | null }[]>`
    SELECT r.period_start::text, r.period_end::text, r.amount_kobo, r.status, r.grace_until::text
    FROM renewals r JOIN memberships m ON m.id = r.membership_id WHERE m.user_id = ${user.id}
  `;
  return (
    <>
      <p className="kicker">Renewals</p>
      <h1>Annual renewal</h1>
      <p>Any renewal must specify cost, benefits, approval authority and grace periods. Nothing is auto-charged until a schedule is adopted.</p>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Period</th><th>Amount</th><th>Grace</th><th>Status</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={4}>No renewal cycle opened.</td></tr> : rows.map((r, i) => (
              <tr key={i}><td>{r.period_start} → {r.period_end}</td><td>{formatNgn(r.amount_kobo)}</td><td>{r.grace_until ?? "—"}</td><td>{r.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
