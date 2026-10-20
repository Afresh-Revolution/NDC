import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Cases" };

export default function CasesPage() {
  return (
    <>
      <PageHero
        kicker="Outcomes"
        title="A successful year is developer income, not the largest pot."
        lede="Cases will publish verified customer traction, completed delivery, and auditable savings — never guaranteed returns or token mechanics."
      />
      <div className="narrow" style={{ paddingBottom: "4rem" }}>
        <div className="panel">
          <p>No completed public cases yet. Pilot 2–3 ring-fenced projects with modest, transparent grants after studio income and ledger controls exist.</p>
        </div>
      </div>
    </>
  );
}
