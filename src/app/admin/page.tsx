import { createStudioOpportunity } from "@/app/actions/admin";
import { PoolChart } from "@/components/admin/PoolChart";
import { sql } from "@/db";
import { poolBalance } from "@/lib/ledger";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Super admin" };

export default async function AdminHome() {
  const members = (await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM memberships WHERE status = 'active'`)[0]?.n ?? 0;
  const pending = (await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM memberships WHERE status IN ('under_review', 'payment_pending')`)[0]?.n ?? 0;
  const projects = (await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM project_submissions`)[0]?.n ?? 0;
  const kinds = ["member_savings", "operating", "project_development", "reserve", "client_escrow", "external_grant"] as const;
  const pools = [];
  for (const kind of kinds) {
    pools.push({ name: kind.replaceAll("_", " "), kobo: Number(await poolBalance(kind)) });
  }
  return (
    <>
      <p className="kicker">National administration</p>
      <h1>Controls, not a trading floor.</h1>
      <div className="grid-3">
        <article className="panel"><p className="kicker">Active members</p><p className="mono" style={{ fontSize: "1.8rem" }}>{members}</p></article>
        <article className="panel"><p className="kicker">Admissions queue</p><p className="mono" style={{ fontSize: "1.8rem" }}>{pending}</p></article>
        <article className="panel"><p className="kicker">Projects filed</p><p className="mono" style={{ fontSize: "1.8rem" }}>{projects}</p></article>
      </div>
      <div className="panel" style={{ marginTop: "1rem" }}>
        <p className="kicker">Restricted pools</p>
        <PoolChart data={pools} />
        <ul>
          {pools.map((p) => (
            <li key={p.name}>{p.name}: {formatNgn(p.kobo)}</li>
          ))}
        </ul>
      </div>
      <form action={createStudioOpportunity} className="panel" style={{ marginTop: "1rem" }}>
        <h3>Post a studio opportunity</h3>
        <div className="field"><label>Title</label><input name="title" required /></div>
        <div className="field"><label>Brief</label><textarea name="brief" rows={4} required /></div>
        <div className="field"><label>Budget NGN (optional)</label><input name="budget" type="number" min={0} /></div>
        <label><input type="checkbox" name="isPublic" /> Public listing</label>
        <div style={{ marginTop: "0.8rem" }}><button className="btn" type="submit">Publish brief</button></div>
      </form>
    </>
  );
}
