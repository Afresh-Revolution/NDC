import { PageHero } from "@/components/PageHero";
import { getMembershipSettings } from "@/lib/membership";
import { formatNgn } from "@/lib/money";
import Link from "next/link";

export const metadata = { title: "Membership" };

const CLASSES = [
  ["Full professional member", "Verified professional; pays adopted obligations; may vote, serve in office, submit projects and join paid delivery teams subject to eligibility."],
  ["Associate / student", "Training and mentorship access; no automatic voting, borrowing or project finance rights; conversion path after verification."],
  ["Corporate / partner", "May sponsor challenges, provide service work or mentorship under contract; voting and share rights only if law and bylaws permit."],
  ["Honorary adviser", "Advisory participation; no financial, voting or administrative privileges unless separately eligible."],
];

export default async function MembershipPage() {
  let fees = "Professional membership is ₦2,500 monthly or ₦25,000 yearly, plus a one-time ₦5,000 registration. Associate membership is ₦1,000 monthly or ₦10,000 yearly, with no registration fee.";
  try {
    const settings = await getMembershipSettings();
    fees = `Professional membership is ${formatNgn(settings.professional_monthly_kobo)} monthly or ${formatNgn(settings.professional_yearly_kobo)} yearly, plus a one-time ${formatNgn(settings.registration_kobo)} registration. Associate membership is ${formatNgn(settings.associate_monthly_kobo)} monthly or ${formatNgn(settings.associate_yearly_kobo)} yearly.`;
  } catch {
    fees = "Professional membership is ₦2,500 monthly or ₦25,000 yearly, plus a one-time ₦5,000 registration. Associate membership is ₦1,000 monthly or ₦10,000 yearly.";
  }
  return (
    <>
      <PageHero
        kicker="02 / Membership and eligibility"
        title="Eligible builders, not open-ended promises."
        lede="Frontend, backend, mobile, DevOps/SRE, QA, cybersecurity, data/AI, game developers, UI/UX, technical PMs, technical writers, and founders actively building software."
      />
      <div className="container" style={{ paddingBottom: "4rem" }}>
        <div className="grid-2">
          {CLASSES.map(([title, body]) => (
            <article className="panel" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="panel" style={{ marginTop: "1.5rem" }}>
          <p className="kicker">Admission workflow</p>
          <ol>
            <li>Identity and contact verification; portfolio/GitHub/GitLab or alternative work evidence; skill declaration.</li>
            <li>Code of conduct, bylaws, funding-risk disclosures, privacy notice and IP commitments accepted explicitly.</li>
            <li>Application and dues invoicing; verified payment; committee approval; issuance of digital member card.</li>
            <li>Denial requires a stated reason and an independent appeals mechanism.</li>
          </ol>
          <p className="muted">{fees} Membership dues are separate from savings. Cancelling stops new invoices.</p>
          <Link href="/register" className="btn">
            Start application
          </Link>
        </div>
      </div>
    </>
  );
}
