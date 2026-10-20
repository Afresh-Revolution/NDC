import { applyToOpportunity } from "@/app/actions/studio";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";
import Link from "next/link";

export const metadata = { title: "Opportunity board" };

export default async function StudioBoardPage() {
  const rows = await sql<{ id: string; title: string; brief: string; budget_kobo: number | null; status: string }[]>`
    SELECT id, title, brief, budget_kobo, status FROM opportunities ORDER BY created_at DESC
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Opportunity board</h1>
      <p>Matching is by skill and availability. This is not guaranteed employment.</p>
      <p>
        <Link href="/workspace/studio/rfps" className="tag">RFPs</Link>{" "}
        <Link href="/workspace/studio/matching" className="tag">Matching</Link>{" "}
        <Link href="/workspace/studio/proposals" className="tag">Proposals</Link>{" "}
        <Link href="/workspace/studio/contracts" className="tag">Contracts</Link>{" "}
        <Link href="/workspace/studio/sprints" className="tag">Sprints</Link>{" "}
        <Link href="/workspace/studio/delivery" className="tag">Delivery</Link>{" "}
        <Link href="/workspace/studio/qa" className="tag">QA</Link>{" "}
        <Link href="/workspace/studio/reviews" className="tag">Reviews</Link>
      </p>
      {rows.length === 0 ? <div className="panel">No briefs yet.</div> : rows.map((r) => (
        <form action={applyToOpportunity} key={r.id} className="panel" style={{ marginBottom: "0.8rem" }}>
          <input type="hidden" name="opportunityId" value={r.id} />
          <h3>{r.title}</h3>
          <p>{r.brief}</p>
          <p className="muted">{r.budget_kobo ? formatNgn(r.budget_kobo) : "budget unpublished"} · {r.status}</p>
          <button className="btn small" type="submit">Apply</button>
        </form>
      ))}
    </>
  );
}
