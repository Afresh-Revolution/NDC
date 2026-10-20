import { requireUser } from "@/app/actions/auth";
import { beginMfaSetup, confirmMfaSetup, disableMfa, dismissBackupCodes } from "@/app/actions/mfa";
import { disconnectOauth } from "@/app/actions/account";
import { sql } from "@/db";
import { decrypt } from "@/lib/crypto";
import { createTotp, totpQrDataUrl } from "@/lib/mfa";
import { cookies } from "next/headers";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ mfa?: string; enrolled?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const oauth = await sql<{ provider: string }[]>`SELECT provider FROM oauth_connections WHERE user_id = ${user.id}`;
  const account = (await sql<{ mfa_enabled: boolean; mfa_secret: string | null }[]>`
    SELECT mfa_enabled, mfa_secret FROM users WHERE id = ${user.id}
  `)[0];
  const pending = Boolean(account && !account.mfa_enabled && account.mfa_secret);
  let qr = "";
  let manual = "";
  if (pending && account?.mfa_secret) {
    try {
      const base32 = decrypt(account.mfa_secret);
      const totp = createTotp(user.email, base32);
      manual = base32;
      qr = await totpQrDataUrl(totp.toString());
    } catch {
      manual = "";
    }
  }
  const flash = (await cookies()).get("ndc_mfa_backup")?.value;
  let backupCodes: string[] = [];
  if (flash) {
    try {
      const parsed = JSON.parse(decrypt(flash));
      if (Array.isArray(parsed)) backupCodes = parsed.map(String);
    } catch {
      backupCodes = [];
    }
  }
  return (
    <>
      <p className="kicker">Settings</p>
      <h1>Account controls</h1>
      {sp.mfa === "invalid" ? <div className="flash error">That code or password was not accepted.</div> : null}
      {sp.mfa === "missing" ? <div className="flash error">Start authenticator setup again.</div> : null}
      {sp.mfa === "off" ? <div className="flash">Authenticator turned off.</div> : null}
      {sp.enrolled ? <div className="flash">Authenticator is on. The next sign-in will ask for a code.</div> : null}
      <div className="panel">
        <h3>Authenticator</h3>
        <p>Admins and payout approvers need an authenticator app before production payouts. Google Authenticator, Authy, and 1Password all work.</p>
        <p>Status: {user.mfaEnabled ? "MFA on" : "MFA off"}</p>
        {backupCodes.length > 0 ? (
          <form action={dismissBackupCodes}>
            <p>Save these backup codes now. Each code works once if you lose the authenticator.</p>
            <ul>
              {backupCodes.map((code) => <li key={code}><code>{code}</code></li>)}
            </ul>
            <button className="btn small" type="submit">I have saved these codes</button>
          </form>
        ) : user.mfaEnabled ? (
          <form action={disableMfa}>
            <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" /></div>
            <div className="field"><label htmlFor="disable-code">Authenticator or backup code</label><input id="disable-code" name="code" required autoComplete="one-time-code" /></div>
            <button className="btn small danger" type="submit">Turn off authenticator</button>
          </form>
        ) : pending && manual ? (
          <form action={confirmMfaSetup}>
            <p>Scan this code, then enter the 6-digit code from the app.</p>
            {qr ? <img src={qr} alt="Authenticator setup QR code" width={220} height={220} /> : null}
            <p>Manual key: <code>{manual}</code></p>
            <div className="field"><label htmlFor="code">6-digit code</label><input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required /></div>
            <button className="btn" type="submit">Confirm authenticator</button>
          </form>
        ) : (
          <form action={beginMfaSetup}>
            <button className="btn" type="submit">Set up authenticator</button>
          </form>
        )}
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
