import { approveWithdrawal } from "@/app/actions/admin";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Savings" };

export default async function AdminSavingsPage() {
  const claims = await sql<{ email: string; balance_kobo: string }[]>`
    SELECT u.email, s.balance_kobo::text FROM savings_claims s JOIN users u ON u.id = s.user_id
  `;
  const withdrawals = await sql<{ id: string; email: string; amount_kobo: number; status: string }[]>`
    SELECT w.id, u.email, w.amount_kobo, w.status
    FROM withdrawals w JOIN users u ON u.id = w.user_id
    WHERE w.status IN ('requested', 'first_approval')
  `;
  return (
    <>
      <p className="kicker">Member claims</p>
      <h1>Savings liabilities</h1>
      <p>Dual control: first approver records intent; second independent approver posts the journal. MFA required in production.</p>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Member</th><th>Claim</th></tr></thead>
          <tbody>{claims.map((c) => <tr key={c.email}><td>{c.email}</td><td>{formatNgn(c.balance_kobo)}</td></tr>)}</tbody>
        </table>
      </div>
      {withdrawals.map((w) => (
        <form action={approveWithdrawal} key={w.id} className="panel" style={{ marginTop: "0.8rem" }}>
          <input type="hidden" name="id" value={w.id} />
          <p>{w.email} · {formatNgn(w.amount_kobo)} · {w.status}</p>
          <div className="field"><label htmlFor={`code-${w.id}`}>Authenticator code</label><input id={`code-${w.id}`} name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="Required once MFA is on" /></div>
          <button className="btn small" name="slot" value="one" type="submit">First approval</button>{" "}
          <button className="btn small" name="slot" value="two" type="submit">Second approval and payout</button>
        </form>
      ))}
    </>
  );
}
