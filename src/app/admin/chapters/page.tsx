import { sql } from "@/db";
import Link from "next/link";

export const metadata = { title: "State dashboards" };

export default async function AdminChaptersPage() {
  const rows = await sql<{ state_code: string; name: string; members: number }[]>`
    SELECT c.state_code, c.name, count(p.user_id)::int AS members
    FROM chapters c
    LEFT JOIN profiles p ON p.chapter_id = c.id
    GROUP BY c.state_code, c.name
    ORDER BY c.name
  `;
  return (
    <>
      <p className="kicker">Chapters</p>
      <h1>State dashboards</h1>
      <p>Coordinators have no unrestricted finance powers.</p>
      <div className="grid-3">
        {rows.map((c) => (
          <article className="panel" key={c.state_code}>
            <span className="tag">{c.state_code}</span>
            <h3>{c.name}</h3>
            <p>{c.members} profile(s)</p>
            <Link href={`/chapters/${c.state_code.toLowerCase()}`}>Public page</Link>
          </article>
        ))}
      </div>
    </>
  );
}
