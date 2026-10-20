import { registerEvent } from "@/app/actions/community";
import { sql } from "@/db";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const rows = await sql<{ id: string; title: string; body: string | null; starts_at: string }[]>`
    SELECT id, title, body, starts_at::text FROM events ORDER BY starts_at
  `;
  return (
    <>
      <p className="kicker">Learning</p>
      <h1>Events</h1>
      {rows.length === 0 ? <div className="panel">No events scheduled.</div> : rows.map((e) => (
        <form action={registerEvent} key={e.id} className="panel" style={{ marginBottom: "0.8rem" }}>
          <input type="hidden" name="eventId" value={e.id} />
          <h3>{e.title}</h3>
          <p>{e.body}</p>
          <p className="muted">{e.starts_at}</p>
          <button className="btn small" type="submit">Register</button>
        </form>
      ))}
    </>
  );
}
