import { sql } from "@/db";

export const metadata = { title: "Sprints" };

export default async function SprintsPage() {
  const rows = await sql<{ name: string; goal: string | null; starts_on: string; ends_on: string }[]>`
    SELECT name, goal, starts_on::text, ends_on::text FROM sprints ORDER BY starts_on DESC
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Delivery sprints</h1>
      {rows.length === 0 ? <div className="panel">No sprints scheduled.</div> : rows.map((s, i) => (
        <article className="panel" key={i}><h3>{s.name}</h3><p>{s.goal}</p><p className="muted">{s.starts_on} → {s.ends_on}</p></article>
      ))}
    </>
  );
}
