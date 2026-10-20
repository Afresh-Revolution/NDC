import { registerAction } from "@/app/actions/auth";
import { PublicHeader } from "@/components/public/PublicChrome";
import Link from "next/link";

export const metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <>
      <PublicHeader />
      <div className="narrow" style={{ padding: "4rem 0" }}>
        <p className="kicker">Onboarding · 1 of 10</p>
        <h1>Create an account</h1>
        <p className="lede">Membership is an application, not an entitlement. You will verify contact, declare skills, accept policies, and await committee review.</p>
        <form action={registerAction} className="panel">
          <div className="grid-2">
            <div className="field"><label htmlFor="firstName">First name</label><input id="firstName" name="firstName" required /></div>
            <div className="field"><label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" required /></div>
          </div>
          <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required /></div>
          <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" /></div>
          <div className="field"><label htmlFor="password">Password (min 10)</label><input id="password" name="password" type="password" minLength={10} required /></div>
          <div className="field">
            <label htmlFor="membershipClass">Pathway</label>
            <select id="membershipClass" name="membershipClass" defaultValue="full_professional">
              <option value="full_professional">Full professional member</option>
              <option value="associate_student">Associate / student (non-voting)</option>
              <option value="corporate_partner">Corporate / partner</option>
            </select>
          </div>
          <button className="btn" type="submit">Create account</button>
          <p style={{ marginTop: "1rem" }}>Already applied? <Link href="/login">Sign in</Link></p>
        </form>
      </div>
    </>
  );
}
