import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <>
      <PageHero
        kicker="Institution"
        title="Offices exist; individuals are elected."
        lede="The General Assembly elects the board. Committees separate initiation, approval, disbursement, bookkeeping and reconciliation."
      />
      <div className="container" style={{ paddingBottom: "4rem" }}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Body</th>
                <th>Responsibility</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>General Assembly</td><td>Elect board, ratify bylaws, budgets, audits, material investment and governance policies.</td></tr>
              <tr><td>Board of Directors</td><td>Strategy, risk appetite, budget, executive oversight and policy adoption.</td></tr>
              <tr><td>Management / Secretariat</td><td>Membership operations, support, procurement and contract execution.</td></tr>
              <tr><td>Finance / Audit</td><td>Statements, reconciliations, reserves, controls and independent audit coordination.</td></tr>
              <tr><td>Technical Review</td><td>Architecture, engineering standards, cyber/data diligence, milestones.</td></tr>
              <tr><td>Investment / Project</td><td>Project triage, funding decisions and monitored exposure.</td></tr>
              <tr><td>Ethics and Disputes</td><td>Conflicts of interest, grievances, procedural fairness and appeals.</td></tr>
              <tr><td>State chapter coordinators</td><td>Local community programmes and support; no unrestricted finance powers.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
