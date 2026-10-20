import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Share capital" };

export default async function SharesPage() {
  const user = await requireUser();
  const shares = await sql<{ units: number; unit_price_kobo: number; status: string; issued_at: string }[]>`
    SELECT s.units, s.unit_price_kobo, s.status, s.issued_at::text
    FROM member_shares s JOIN memberships m ON m.id = s.membership_id
    WHERE m.user_id = ${user.id}
  `;
  return (
    <>
      <p className="kicker">Ownership instrument</p>
      <h1>Cooperative share capital</h1>
      <p>Shares are a separate instrument from savings, with legally defined rights and exit rules. They are not described as savings.</p>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Units</th><th>Unit price</th><th>Status</th><th>Issued</th></tr></thead>
          <tbody>
            {shares.length === 0 ? <tr><td colSpan={4}>No shares issued yet.</td></tr> : shares.map((s, i) => (
              <tr key={i}><td>{s.units}</td><td>{formatNgn(s.unit_price_kobo)}</td><td>{s.status}</td><td>{s.issued_at.slice(0, 10)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
