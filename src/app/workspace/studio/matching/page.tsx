import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";

export const metadata = { title: "Matching" };

export default async function MatchingPage() {
  const user = await requireUser();
  const rows = await sql<{ title: string; status: string; score: string | null }[]>`
    SELECT o.title, m.status, m.score::text
    FROM matches m JOIN opportunities o ON o.id = m.opportunity_id
    WHERE m.user_id = ${user.id}
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Skill matching</h1>
      {rows.length === 0 ? <div className="panel">No matches yet.</div> : (
        <ul>{rows.map((r, i) => <li key={i}>{r.title} · {r.status} · score {r.score ?? "n/a"}</li>)}</ul>
      )}
    </>
  );
}
