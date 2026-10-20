import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";

export const metadata = { title: "Skills" };

export default async function SkillsPage() {
  const user = await requireUser();
  const mine = await sql<{ name: string; level: string }[]>`
    SELECT s.name, ms.level FROM member_skills ms JOIN skills s ON s.id = ms.skill_id WHERE ms.user_id = ${user.id}
  `;
  const dev = (await sql<{ discipline: string | null; seniority: string | null; years_experience: string | null }[]>`
    SELECT discipline, seniority, years_experience::text FROM developer_profiles WHERE user_id = ${user.id}
  `)[0];
  return (
    <>
      <p className="kicker">Skills</p>
      <h1>{dev?.discipline ?? "Undeclared discipline"}</h1>
      <p className="muted">{dev?.seniority} · {dev?.years_experience ?? "0"} years</p>
      <div className="panel">
        {mine.length === 0 ? <p>No skills recorded. Complete onboarding.</p> : mine.map((s) => (
          <p key={s.name}><span className="tag">{s.level}</span> {s.name}</p>
        ))}
      </div>
    </>
  );
}
