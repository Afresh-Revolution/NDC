import { sql } from "@/db";
import { poolBalance } from "@/lib/ledger";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Treasury" };

export default async function TreasuryPage() {
  const accounts = await sql<{ code: string; name: string; type: string; savings: boolean }[]>`
    SELECT code, name, type::text, is_savings_liability AS savings FROM accounts ORDER BY code
  `;
  const kinds = ["member_savings", "operating", "project_development", "reserve", "client_escrow", "external_grant"] as const;
  const pools = await Promise.all(kinds.map(async (k) => ({ k, v: await poolBalance(k) })));
  return (
    <>
      <p className="kicker">Treasury</p>
      <h1>Chart of accounts and restricted pools</h1>
      <div className="grid-2">
        {pools.map((p) => (
          <article className="panel" key={p.k}>
            <p className="kicker">{p.k}</p>
            <p className="mono" style={{ fontSize: "1.4rem" }}>{formatNgn(p.v.toString())}</p>
          </article>
        ))}
      </div>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data">
          <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Savings liability</th></tr></thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.code}><td className="mono">{a.code}</td><td>{a.name}</td><td>{a.type}</td><td>{a.savings ? "yes" : "no"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
