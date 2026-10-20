import { issueSanction } from "@/app/actions/admin";
import { sql } from "@/db";

export const metadata = { title: "Sanctions" };

export default async function SanctionsPage() {
  const rows = await sql<{ email: string; reason: string; action: string; created_at: string }[]>`
    SELECT u.email, s.reason, s.action, s.created_at::text
    FROM sanctions s JOIN users u ON u.id = s.user_id ORDER BY s.created_at DESC
  `;
  return (
    <>
      <p className="kicker">Conduct</p>
      <h1>Proportional sanctions</h1>
      <p>Written complaints, evidence access, independent review. Savings are not confiscated as a first response to arrears.</p>
      <form action={issueSanction} className="panel">
        <div className="field"><label>Member email</label><input name="email" type="email" required /></div>
        <div className="field"><label>Action</label>
          <select name="action">
            <option value="warning">Warning</option>
            <option value="suspension">Suspension</option>
            <option value="removal_from_studio">Removal from studio roster</option>
          </select>
        </div>
        <div className="field"><label>Reason</label><textarea name="reason" required /></div>
        <button className="btn" type="submit">Record sanction</button>
      </form>
      <ul>{rows.map((r, i) => <li key={i}>{r.email} · {r.action} — {r.reason}</li>)}</ul>
    </>
  );
}
