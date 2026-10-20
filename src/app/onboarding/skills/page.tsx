import { saveSkills } from "@/app/actions/onboarding";
import { sql } from "@/db";

export const metadata = { title: "Skills" };

export default async function SkillsOnboardingPage() {
  const skills = await sql<{ id: string; name: string; category: string }[]>`SELECT id, name, category FROM skills ORDER BY category, name`;
  return (
    <div className="narrow">
      <p className="kicker">Onboarding · skills</p>
      <h1>Declare discipline and stack</h1>
      <form action={saveSkills} className="panel">
        <div className="field"><label htmlFor="discipline">Primary discipline</label><input id="discipline" name="discipline" required placeholder="e.g. Backend engineering" /></div>
        <div className="field">
          <label htmlFor="seniority">Seniority</label>
          <select id="seniority" name="seniority">
            <option>junior</option>
            <option>mid</option>
            <option>senior</option>
            <option>staff</option>
            <option>principal</option>
          </select>
        </div>
        <div className="field"><label htmlFor="years">Years of experience</label><input id="years" name="years" type="number" min={0} step="0.5" defaultValue={1} /></div>
        <fieldset className="field">
          <legend className="kicker">Skills</legend>
          {skills.map((s) => (
            <label key={s.id} style={{ display: "block", textTransform: "none", letterSpacing: 0, fontFamily: "inherit" }}>
              <input type="checkbox" name="skill" value={s.id} /> {s.name}
            </label>
          ))}
        </fieldset>
        <button className="btn" type="submit">Save skills</button>
      </form>
    </div>
  );
}
