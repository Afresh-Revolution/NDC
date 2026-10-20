import { verifyMfaAction } from "@/app/actions/mfa";
import { safeNext } from "@/lib/safe-next";
import { currentUser } from "@/lib/auth";
import { PublicHeader } from "@/components/public/PublicChrome";
import { redirect } from "next/navigation";

export const metadata = { title: "Authenticator" };

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await currentUser();
  const sp = await searchParams;
  const dest = safeNext(sp.next ?? "/workspace");
  if (!user) redirect(`/login?next=${encodeURIComponent(dest)}`);
  if (!user.mfaEnabled || user.mfaVerified) redirect(dest);
  return (
    <>
      <PublicHeader />
      <div className="narrow" style={{ padding: "4rem 0" }}>
        <p className="kicker">Step-up</p>
        <h1>Authenticator required</h1>
        {sp.error ? <div className="flash error">That code was not accepted. Try the next code from your app, or a backup code.</div> : null}
        <form action={verifyMfaAction} className="panel">
          <input type="hidden" name="next" value={dest} />
          <p>Enter the 6-digit code from your authenticator app for {user.email}.</p>
          <div className="field">
            <label htmlFor="code">Authenticator or backup code</label>
            <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required autoFocus />
          </div>
          <button className="btn" type="submit">Continue</button>
        </form>
      </div>
    </>
  );
}
