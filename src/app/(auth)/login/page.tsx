import { loginAction } from "@/app/actions/auth";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicChrome";

export const metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <>
      <PublicHeader />
      <div className="narrow" style={{ padding: "4rem 0" }}>
        <p className="kicker">Member access</p>
        <h1>Sign in</h1>
        {sp.error ? <div className="flash error">Invalid credentials or suspended account.</div> : null}
        <form action={loginAction} className="panel">
          <input type="hidden" name="next" value={sp.next || "/workspace"} />
          <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" /></div>
          <button className="btn" type="submit">Continue</button>
          <p style={{ marginTop: "1rem" }}>
            <Link href="/reset">Reset password</Link> · <Link href="/register">Apply</Link>
          </p>
        </form>
      </div>
    </>
  );
}
