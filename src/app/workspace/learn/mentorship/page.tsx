import { requestMentorship } from "@/app/actions/community";
import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";

export const metadata = { title: "Mentorship" };

export default async function MentorshipPage() {
  const user = await requireUser();
  const rows = await sql<{ status: string; focus: string | null }[]>`
    SELECT status, focus FROM mentorships WHERE mentee_id = ${user.id} OR mentor_id = ${user.id}
  `;
  return (
    <>
      <p className="kicker">Learning</p>
      <h1>Mentorship</h1>
      <form action={requestMentorship} className="panel">
        <div className="field"><label>Mentor email</label><input name="mentorEmail" type="email" required /></div>
        <div className="field"><label>Focus</label><input name="focus" /></div>
        <button className="btn" type="submit">Request mentorship</button>
      </form>
      <ul>{rows.map((r, i) => <li key={i}>{r.status} · {r.focus}</li>)}</ul>
    </>
  );
}
