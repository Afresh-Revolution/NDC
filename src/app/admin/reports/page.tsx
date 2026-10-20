import { sql } from "@/db";
import { poolBalance } from "@/lib/ledger";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const active = (await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM memberships WHERE status = 'active'`)[0]?.n ?? 0;
  const reviewed = (await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM project_submissions WHERE score_total IS NOT NULL`)[0]?.n ?? 0;
  const financed = (await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM funding_agreements WHERE status = 'signed'`)[0]?.n ?? 0;
  const hours = (await sql<{ m: string }[]>`SELECT COALESCE(sum(minutes),0)::text AS m FROM timesheets`)[0]?.m ?? "0";
  const savings = await poolBalance("member_savings");
  const grant = await poolBalance("project_development");
  return (
    <>
      <p className="kicker">Impact dashboard</p>
      <h1>Programme metrics</h1>
      <div className="grid-2">
        <article className="panel"><p className="kicker">Active members</p><p>{active}</p></article>
        <article className="panel"><p className="kicker">Savings pool (liability)</p><p>{formatNgn(savings.toString())}</p></article>
        <article className="panel"><p className="kicker">Project development fund</p><p>{formatNgn(grant.toString())}</p></article>
        <article className="panel"><p className="kicker">Projects reviewed vs financed</p><p>{reviewed} / {financed}</p></article>
        <article className="panel"><p className="kicker">Recorded studio minutes</p><p>{hours}</p></article>
        <article className="panel"><p className="kicker">Loan default ratio</p><p>Undefined until finance products are legally launched.</p></article>
      </div>
    </>
  );
}
