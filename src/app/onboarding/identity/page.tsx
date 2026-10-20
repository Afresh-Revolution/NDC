import { saveIdentity } from "@/app/actions/onboarding";
import { sql } from "@/db";

export const metadata = { title: "Identity" };

export default async function IdentityPage() {
  const chapters = await sql<{ state_code: string; name: string }[]>`SELECT state_code, name FROM chapters ORDER BY name`;
  return (
    <div className="narrow">
      <p className="kicker">Onboarding · identity</p>
      <h1>Verify who you are</h1>
      <p>Identity files are stored privately. Administrators review them; they never appear on the public directory.</p>
      <form action={saveIdentity} className="panel">
        <div className="field">
          <label htmlFor="idType">ID type</label>
          <select id="idType" name="idType" required>
            <option value="nin">National Identification Number</option>
            <option value="passport">International passport</option>
            <option value="drivers_license">Driver’s licence</option>
            <option value="voters_card">Voter’s card</option>
          </select>
        </div>
        <div className="field"><label htmlFor="city">City</label><input id="city" name="city" required /></div>
        <div className="field">
          <label htmlFor="state">Chapter / state</label>
          <select id="state" name="state" required>
            {chapters.map((c) => (
              <option key={c.state_code} value={c.state_code}>{c.name}</option>
            ))}
          </select>
        </div>
        <p className="muted">Document upload uses private storage after the operator connects Cloudinary/Supabase. A pending identity record is created now for committee review.</p>
        <button className="btn" type="submit">Save identity</button>
      </form>
    </div>
  );
}
