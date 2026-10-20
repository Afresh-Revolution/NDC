import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Mission" };

export default function MissionPage() {
  return (
    <>
      <PageHero
        kicker="00 / Executive direction"
        title="Help builders access responsible capital and trusted collaborators."
        lede="NDC Naija is proposed as a member-owned institution for software developers and adjacent technology professionals, initially organised around Northern Nigeria."
      />
      <div className="container" style={{ paddingBottom: "4rem" }}>
        <div className="grid-3">
          <article className="panel">
            <p className="kicker">Mission</p>
            <p>
              Help technology builders access responsible capital, trusted collaborators, market
              opportunities, and the infrastructure required to develop sustainable products.
            </p>
          </article>
          <article className="panel">
            <p className="kicker">Vision</p>
            <p>
              A developer-led cooperative that helps commercially viable technology products emerge
              from Northern Nigeria for African and international markets.
            </p>
          </article>
          <article className="panel">
            <p className="kicker">Values</p>
            <p>
              Member democracy; technical excellence; transparency; fair work; intellectual-property
              respect; inclusion; privacy; security; evidence-based decisions.
            </p>
          </article>
        </div>
        <div className="panel" style={{ marginTop: "1.5rem" }}>
          <p className="kicker">Evidence, not proof of demand</p>
          <p>
            Africa: The Big Deal reports Nigeria startup funding of about $343m in 2025, 17% below
            2024 — funding is not evenly accessible. GitHub reports open-source maintainers often
            work without assured financial support. Platform cooperatives can share capital, software
            ownership and democratic control.
          </p>
          <p className="muted">
            Before launch, interview at least 40–60 developers, 10–15 prospective buyers and 5–10
            existing cooperative or innovation ecosystem operators; publish anonymised findings.
          </p>
        </div>
      </div>
    </>
  );
}
