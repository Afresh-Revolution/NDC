import { PublicHeader } from "@/components/public/PublicChrome";

export const metadata = { title: "MFA" };

export default function MfaPage() {
  return (
    <>
      <PublicHeader />
      <div className="narrow" style={{ padding: "4rem 0" }}>
        <p className="kicker">Step-up</p>
        <h1>Authenticator required</h1>
        <div className="panel">
          <p>Admins and payout approvers must complete TOTP MFA. Seed an authenticator in production before enabling live disbursements.</p>
        </div>
      </div>
    </>
  );
}
