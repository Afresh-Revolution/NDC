import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { requestWithdrawal } from "@/app/actions/finance";
import { memberSavingsBalance } from "@/lib/ledger";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Withdrawals" };

export default async function WithdrawalsPage() {
  const user = await requireUser();
  const bal = await memberSavingsBalance(user.id);
  const rows = await sql<{ amount_kobo: number; status: string; requested_at: string }[]>`
    SELECT amount_kobo, status, requested_at::text FROM withdrawals WHERE user_id = ${user.id} ORDER BY requested_at DESC
  `;
  return (
    <>
      <p className="kicker">Withdrawals</p>
      <h1>Eligible withdrawable balance: {formatNgn(bal.toString())}</h1>
      <p>Requests are subject to bylaws, liquidity planning, dual-control approval and documented debts. They are never used to patch project losses.</p>
      <form action={requestWithdrawal} className="panel">
        <div className="field"><label>Amount (NGN)</label><input name="amount" type="number" min={1} step="0.01" required /></div>
        <div className="field"><label>Bank</label><input name="bank" required /></div>
        <div className="field"><label>NUBAN</label><input name="nuban" required minLength={10} /></div>
        <button className="btn" type="submit">Request payout</button>
      </form>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data">
          <thead><tr><th>Amount</th><th>Status</th><th>Requested</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}><td>{formatNgn(r.amount_kobo)}</td><td>{r.status}</td><td>{r.requested_at.slice(0, 10)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
