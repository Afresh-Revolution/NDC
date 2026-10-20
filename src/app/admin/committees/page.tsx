import { assignCommittee } from "@/app/actions/admin";
import { sql } from "@/db";

export const metadata = { title: "Committees" };

export default async function CommitteesPage() {
  const committees = await sql<{ slug: string; name: string; mandate: string }[]>`SELECT slug, name, mandate FROM committees`;
  const assignments = await sql<{ committee: string; display_name: string; title: string }[]>`
    SELECT c.name AS committee, p.display_name, a.title
    FROM committee_assignments a
    JOIN committees c ON c.id = a.committee_id
    JOIN profiles p ON p.user_id = a.user_id
  `;
  return (
    <>
      <p className="kicker">Governance</p>
      <h1>Committees</h1>
      <div className="grid-2">
        {committees.map((c) => (
          <article className="panel" key={c.slug}>
            <h3>{c.name}</h3>
            <p>{c.mandate}</p>
          </article>
        ))}
      </div>
      <form action={assignCommittee} className="panel" style={{ marginTop: "1rem" }}>
        <div className="field"><label>Member email</label><input name="email" type="email" required /></div>
        <div className="field"><label>Committee</label>
          <select name="committee">{committees.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        </div>
        <div className="field"><label>Seat title</label><input name="title" defaultValue="member" /></div>
        <button className="btn" type="submit">Assign</button>
      </form>
      <ul>{assignments.map((a, i) => <li key={i}>{a.committee}: {a.display_name} ({a.title})</li>)}</ul>
    </>
  );
}
