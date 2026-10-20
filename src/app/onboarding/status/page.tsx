import { requireUser } from "@/app/actions/auth";
import { fileAppeal } from "@/app/actions/onboarding";
import { sql } from "@/db";
import Link from "next/link";

export const metadata = { title: "Application status" };

export default async function StatusPage() {
  const user = await requireUser();
  const membership = (await sql<{ status: string; class: string; denial_reason: string | null }[]>`
    SELECT status::text, class::text, denial_reason FROM memberships WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
  `)[0];
  return (
    <div className="narrow">
      <p className="kicker">Onboarding · status</p>
      <h1>Application status</h1>
      <div className="panel">
        <p><span className="tag">{membership?.status ?? "draft"}</span> · {membership?.class}</p>
        {membership?.denial_reason ? <p>Denial reason: {membership.denial_reason}</p> : null}
        <p>Committee approval issues a digital member card. Denial requires a stated reason. You may appeal through Ethics and Disputes.</p>
        <Link href="/workspace" className="btn">Open workspace</Link>
        {membership?.status === "denied" ? (
          <form action={fileAppeal} style={{ marginTop: "1rem" }}>
            <div className="field"><label>Appeal</label><textarea name="body" required /></div>
            <button className="btn ghost" type="submit">Submit independent appeal</button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
