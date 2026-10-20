import { sql } from "@/db";

export const metadata = { title: "Local programmes" };

export default async function AdminProgrammesPage() {
  const events = await sql<{ title: string; starts_at: string; chapter: string | null }[]>`
    SELECT e.title, e.starts_at::text, c.name AS chapter
    FROM events e LEFT JOIN chapters c ON c.id = e.chapter_id
    ORDER BY e.starts_at DESC
  `;
  return (
    <>
      <p className="kicker">Chapter</p>
      <h1>Local programmes</h1>
      <div className="panel">{events.length === 0 ? "No local events." : events.map((e, i) => <p key={i}>{e.title} · {e.chapter} · {e.starts_at}</p>)}</div>
    </>
  );
}
