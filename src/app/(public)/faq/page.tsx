import { PageHero } from "@/components/PageHero";

export const metadata = { title: "FAQ" };

const QA = [
  ["Does membership guarantee a loan or grant?", "No. Membership does not automatically guarantee project financing, employment, loans, or investment returns."],
  ["Are monthly contributions operating revenue?", "No. They are generally an obligation to the member according to the adopted savings policy and must be separately recorded."],
  ["Who owns my GitHub repositories?", "You do. NDC membership does not transfer existing ideas, repos, patents, designs or client work. Ownership depends on a signed project-specific instrument."],
  ["Can the cooperative seize my code if I leave?", "No automatic seizure of repos, domains, credentials or source code when a member leaves or disputes arise."],
  ["When will lending launch?", "Only after counsel opinion, any lending permissions, board/member approvals, and explicit feature flags. The product ships with loans disabled."],
  ["How are projects scored?", "Six dimensions totalling 100. Suggested threshold 70/100 to reach committee discussion. IP ownership, legal compliance and solvency gates override the score."],
];

export default function FaqPage() {
  return (
    <>
      <PageHero kicker="FAQ" title="Clear answers. No guaranteed yield." lede="This is a cooperative production ecosystem, not a fintech promising loans to everyone." />
      <div className="narrow" style={{ paddingBottom: "4rem" }}>
        {QA.map(([q, a]) => (
          <article className="panel" key={q} style={{ marginBottom: "0.8rem" }}>
            <h3>{q}</h3>
            <p>{a}</p>
          </article>
        ))}
      </div>
    </>
  );
}
