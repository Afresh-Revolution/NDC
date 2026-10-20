import { saveProjectSection } from "@/app/actions/projects";
import { sql } from "@/db";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await sql<{ display_name: string; role: string }[]>`
    SELECT p.display_name, t.role FROM project_teams t JOIN profiles p ON p.user_id = t.user_id WHERE t.project_id = ${id}
  `;
  return (
    <>
      <form action={saveProjectSection} className="panel">
        <input type="hidden" name="projectId" value={id} />
        <input type="hidden" name="section" value="team" />
        <p>Inventorship and contribution records. A proposer cannot later approve their own funding.</p>
        <div className="field"><label>Member email</label><input name="email" type="email" required /></div>
        <div className="field"><label>Role</label><input name="role" defaultValue="contributor" /></div>
        <button className="btn" type="submit">Add teammate</button>
      </form>
      <ul>{team.map((t) => <li key={t.display_name + t.role}>{t.display_name} — {t.role}</li>)}</ul>
    </>
  );
}
