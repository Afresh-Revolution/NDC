import { PageHero } from "@/components/PageHero";
import Link from "next/link";

export const metadata = { title: "Membership" };

const CLASSES = [
  ["Full professional member", "Verified professional; pays adopted obligations; may vote, serve in office, submit projects and join paid delivery teams subject to eligibility."],
  ["Associate / student", "Training and mentorship access; no automatic voting, borrowing or project finance rights; conversion path after verification."],
  ["Corporate / partner", "May sponsor challenges, provide service work or mentorship under contract; voting and share rights only if law and bylaws permit."],
  ["Honorary adviser", "Advisory participation; no financial, voting or administrative privileges unless separately eligible."],
];

export default function MembershipPage() {
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
          <p className="muted">
            Illustrative fees are not carried over automatically from any prior society. Registration,
            monthly savings, share capital, optional project levy and annual renewal are priced only
            after affordability survey, operating-budget analysis and member approval.
          </p>
          <Link href="/register" className="btn">
            Start application
          </Link>
        </div>
      </div>
    </>
  );
}
