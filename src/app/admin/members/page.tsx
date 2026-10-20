import { sql } from "@/db";
import Link from "next/link";

export const metadata = { title: "Members" };

export default async function MembersAdminPage() {
  const rows = await sql<{
    email: string;
    display_name: string;
    status: string;
    class: string;
    digital_card_number: string | null;
    state_code: string | null;
  }[]>`
    SELECT u.email, p.display_name, m.status::text, m.class::text, p.digital_card_number, p.state_code
    FROM memberships m
    JOIN users u ON u.id = m.user_id
    JOIN profiles p ON p.user_id = u.id
    ORDER BY p.display_name
  `;
  return (
    <>
      <p className="kicker">Register</p>
      <h1>Members</h1>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Name</th><th>Email</th><th>Class</th><th>Status</th><th>Card</th><th>State</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.email}>
                <td>{r.display_name}</td>
                <td>{r.email}</td>
                <td>{r.class}</td>
                <td>{r.status}</td>
                <td className="mono">{r.digital_card_number ?? "—"}</td>
                <td>{r.state_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: "1rem" }}><Link href="/admin/verification">Open admissions queue</Link></p>
    </>
  );
}
