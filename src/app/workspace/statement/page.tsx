import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Statement" };

export default async function StatementPage() {
  const user = await requireUser();
  const lines = await sql<{ posted_at: string; memo: string; debit: string; credit: string; account: string }[]>`
    SELECT je.posted_at::text, je.memo, jl.debit_kobo::text AS debit, jl.credit_kobo::text AS credit, a.name AS account
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.entry_id
    JOIN accounts a ON a.id = jl.account_id
    WHERE jl.member_id = ${user.id}
    ORDER BY je.posted_at DESC
  `;
  return (
    <>
      <p className="kicker">Statement</p>
      <h1>Contribution history</h1>
      <p className="muted">Balances are read from the ledger. Front-end fields cannot edit posted money.</p>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>Memo</th><th>Account</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td className="mono">{l.posted_at.slice(0, 19)}</td>
                <td>{l.memo}</td>
                <td>{l.account}</td>
                <td>{Number(l.debit) ? formatNgn(l.debit) : "—"}</td>
                <td>{Number(l.credit) ? formatNgn(l.credit) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
