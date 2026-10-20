import { requestResetAction } from "@/app/actions/auth";
import { PublicHeader } from "@/components/public/PublicChrome";

export const metadata = { title: "Reset password" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const sp = await searchParams;
  return (
    <>
      <PublicHeader />
      <div className="narrow" style={{ padding: "4rem 0" }}>
        <p className="kicker">Auth</p>
        <h1>Reset password</h1>
        {sp.sent ? <div className="flash">If the account exists, a reset link is on its way.</div> : null}
        <form action={requestResetAction} className="panel">
          <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required /></div>
          <button className="btn" type="submit">Send reset link</button>
        </form>
      </div>
    </>
  );
}
