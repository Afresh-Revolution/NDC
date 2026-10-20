import { PageHero } from "@/components/PageHero";
import { sql } from "@/db";

export const metadata = { title: "Governance" };

export default async function GovernancePage() {
  let policies: { title: string; version: string; slug: string }[] = [];
  try {
    policies = await sql`SELECT DISTINCT ON (slug) title, version, slug FROM policy_versions WHERE published = true ORDER BY slug, effective_at DESC`;
  } catch {
    policies = [];
  }
  return (
    <>
      <PageHero
        kicker="09 / Democratic governance"
        title="One member, one vote — where the bylaws allow."
        lede="Elections require published notice, eligibility, terms, secret ballot and independently reviewed tally. Related-party transactions require disclosure, recusal and approval."
      />
      <div className="container" style={{ paddingBottom: "4rem" }}>
        <div className="grid-2">
          {policies.map((p) => (
            <article className="panel" key={p.slug}>
              <span className="tag">v{p.version}</span>
              <h3>{p.title}</h3>
            </article>
          ))}
        </div>
        <div className="panel" style={{ marginTop: "1.5rem" }}>
          <p className="kicker">Legal launch gates</p>
          <p>Cooperative registration, lending permissions, SEC crowdfunding rules, NDPA, tax filings and Startup Act eligibility are not assumed by this software. Loans, investment and public equity portals are feature-flagged off.</p>
        </div>
      </div>
    </>
  );
}
