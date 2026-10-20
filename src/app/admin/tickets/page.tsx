import { resolveTicket } from "@/app/actions/admin";
import { sql } from "@/db";

export const metadata = { title: "Tickets" };

export default async function TicketsPage() {
  const rows = await sql<{ id: string; subject: string; body: string; status: string }[]>`
    SELECT id, subject, body, status::text FROM support_tickets ORDER BY created_at DESC
  `;
  return (
    <>
      <p className="kicker">Support</p>
      <h1>Tickets</h1>
      {rows.map((t) => (
        <form action={resolveTicket} key={t.id} className="panel" style={{ marginBottom: "0.7rem" }}>
          <input type="hidden" name="id" value={t.id} />
          <h3>{t.subject}</h3>
          <p>{t.body}</p>
          <p className="tag">{t.status}</p>
          <select name="status" defaultValue="resolved">
            <option value="pending">pending</option>
            <option value="resolved">resolved</option>
            <option value="closed">closed</option>
          </select>
          <button className="btn small" type="submit">Update</button>
        </form>
      ))}
    </>
  );
}
