import { decideMembership } from "@/app/actions/admin";
import { sql } from "@/db";

export const metadata = { title: "Verification" };

export default async function VerificationPage() {
  const rows = await sql<{
    id: string;
    email: string;
    display_name: string;
    class: string;
    status: string;
    id_status: string | null;
  }[]>`
    SELECT m.id, u.email, p.display_name, m.class::text, m.status::text,
           (SELECT status FROM identities i WHERE i.user_id = u.id ORDER BY created_at DESC LIMIT 1) AS id_status
    FROM memberships m
    JOIN users u ON u.id = m.user_id
    JOIN profiles p ON p.user_id = u.id
    WHERE m.status IN ('under_review', 'payment_pending', 'submitted', 'appealing')
    ORDER BY m.created_at
  `;
  return (
    <>
      <p className="kicker">Admissions</p>
      <h1>Identity and membership review</h1>
      <p>Denial requires a stated reason. Appeals go to Ethics and Disputes. Digital cards issue only on approval.</p>
      {rows.length === 0 ? <div className="panel">Queue empty.</div> : rows.map((r) => (
        <form action={decideMembership} key={r.id} className="panel" style={{ marginBottom: "0.8rem" }}>
          <input type="hidden" name="membershipId" value={r.id} />
          <h3>{r.display_name} · {r.email}</h3>
          <p>{r.class} · membership {r.status} · identity {r.id_status ?? "none"}</p>
          <div className="field"><label>Denial reason (required if denying)</label><textarea name="reason" rows={2} /></div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn" name="decision" value="approve" type="submit">Approve and issue card</button>
            <button className="btn ghost" name="decision" value="deny" type="submit">Deny with reason</button>
          </div>
        </form>
      ))}
    </>
  );
}
