import { toggleFlag } from "@/app/actions/admin";
import { sql } from "@/db";

export const metadata = { title: "Feature flags" };

export default async function FlagsPage() {
  const rows = await sql<{ key: string; enabled: boolean; description: string }[]>`SELECT key, enabled, description FROM feature_flags`;
  return (
    <>
      <p className="kicker">Launch gates</p>
      <h1>Feature flags</h1>
      <p>Loans, investment and public equity portals remain off until counsel, licensing and board/member approvals exist.</p>
      {rows.map((f) => (
        <form action={toggleFlag} key={f.key} className="panel" style={{ marginBottom: "0.6rem" }}>
          <input type="hidden" name="key" value={f.key} />
          <h3>{f.key}</h3>
          <p>{f.description}</p>
          <label><input type="checkbox" name="enabled" defaultChecked={f.enabled} /> Enabled</label>
          <div style={{ marginTop: "0.6rem" }}><button className="btn small" type="submit">Save</button></div>
        </form>
      ))}
    </>
  );
}
