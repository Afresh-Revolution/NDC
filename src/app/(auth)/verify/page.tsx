import { verifyEmailAction } from "@/app/actions/auth";
import { currentUser } from "@/lib/auth";
import { PublicHeader } from "@/components/public/PublicChrome";
import Link from "next/link";

export const metadata = { title: "Verify contact" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  let verified = false;
  let error: string | null = null;
  if (sp.token) {
    try {
      await verifyEmailAction(sp.token);
      verified = true;
    } catch (e) {
      error = e instanceof Error ? e.message : "Verification failed";
    }
  }
  const user = await currentUser();
  return (
    <>
      <PublicHeader />
      <div className="narrow" style={{ padding: "4rem 0" }}>
        <p className="kicker">Onboarding · 2 of 10</p>
        <h1>Verify contact</h1>
        {verified ? <div className="flash">Email verified. Continue to identity.</div> : null}
        {error ? <div className="flash error">{error}</div> : null}
        <div className="panel">
          <p>We sent a verification link to {user?.email ?? "your email"}. In development, if Resend is not configured, open the link printed in the server log or continue once an administrator marks the address verified.</p>
          <Link href="/onboarding/identity" className="btn">Continue to identity</Link>
        </div>
      </div>
    </>
  );
}
