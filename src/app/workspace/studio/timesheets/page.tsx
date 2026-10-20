import { logTime } from "@/app/actions/studio";
import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";

export const metadata = { title: "Timesheets" };

export default async function TimesheetsPage() {
  const user = await requireUser();
  const opps = await sql<{ id: string; title: string }[]>`SELECT id, title FROM opportunities`;
  const rows = await sql<{ work_date: string; minutes: number; notes: string | null }[]>`
    SELECT work_date::text, minutes, notes FROM timesheets WHERE user_id = ${user.id} ORDER BY work_date DESC
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Hours are the basis of pay</h1>
      <form action={logTime} className="panel">
        <div className="field"><label>Opportunity</label>
          <select name="opportunityId">{opps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select>
        </div>
        <div className="field"><label>Date</label><input type="date" name="date" required /></div>
        <div className="field"><label>Minutes</label><input type="number" name="minutes" min={15} step={15} required /></div>
        <div className="field"><label>Notes</label><input name="notes" /></div>
        <button className="btn" type="submit">Log time</button>
      </form>
      <ul>{rows.map((r, i) => <li key={i}>{r.work_date} · {r.minutes} min · {r.notes}</li>)}</ul>
    </>
  );
}
