import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { disconnectOauth } from "@/app/actions/account";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const oauth = await sql<{ provider: string }[]>`SELECT provider FROM oauth_connections WHERE user_id = ${user.id}`;
  return (
    <>
      <p className="kicker">Settings</p>
      <h1>Account controls</h1>
      <div className="panel">
        <p>MFA is required for admins and payout approvers. Member MFA can be enabled from the super admin security baseline.</p>
        <p>Status: {user.mfaEnabled ? "MFA on" : "MFA off"}</p>
      </div>
      <div className="panel" style={{ marginTop: "1rem" }}>
        <h3>Developer account links</h3>
        <p className="muted">Disconnecting GitHub/GitLab removes the connection without deleting previously approved accounting records.</p>
        {oauth.length === 0 ? <p>No OAuth connections.</p> : oauth.map((o) => (
          <form action={disconnectOauth} key={o.provider}>
            <input type="hidden" name="provider" value={o.provider} />
            <button className="btn small" type="submit">Disconnect {o.provider}</button>
          </form>
        ))}
      </div>
    </>
  );
}
