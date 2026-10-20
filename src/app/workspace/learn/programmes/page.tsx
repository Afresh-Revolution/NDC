import { applyProgramme } from "@/app/actions/community";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Programmes" };

export default async function LearnProgrammesPage() {
  const rows = await sql<{ id: string; title: string; synopsis: string; fee_kobo: number }[]>`
    SELECT id, title, synopsis, fee_kobo FROM training_programmes
  `;
  return (
    <>
      <p className="kicker">Learning</p>
      <h1>Optional courses — never silently taken from savings</h1>
      {rows.map((r) => (
        <form action={applyProgramme} key={r.id} className="panel" style={{ marginBottom: "0.8rem" }}>
          <input type="hidden" name="programmeId" value={r.id} />
          <h3>{r.title}</h3>
          <p>{r.synopsis}</p>
          <p className="muted">{r.fee_kobo ? formatNgn(r.fee_kobo) : "no fee"}</p>
          <button className="btn small" type="submit">Apply</button>
        </form>
      ))}
    </>
  );
}
