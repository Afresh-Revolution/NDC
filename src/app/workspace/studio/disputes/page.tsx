import { raiseDispute } from "@/app/actions/studio";
import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";

export const metadata = { title: "Studio disputes" };

export default async function StudioDisputesPage() {
  const user = await requireUser();
  const rows = await sql<{ body: string; stage: string; status: string }[]>`
    SELECT body, stage, status FROM studio_disputes WHERE raised_by = ${user.id}
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Escalation: project lead → independent committee → forum</h1>
      <form action={raiseDispute} className="panel">
        <div className="field"><label>Details</label><textarea name="body" rows={5} required /></div>
        <button className="btn" type="submit">Open dispute</button>
      </form>
      <ul>{rows.map((r, i) => <li key={i}>{r.status} · {r.stage} — {r.body}</li>)}</ul>
    </>
  );
}
