import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { prettyLabel } from "@/lib/format";
import { memberSavingsBalance, poolBalance } from "@/lib/ledger";
import { formatNgn } from "@/lib/money";
import Link from "next/link";

export const metadata = { title: "Workspace" };

export default async function WorkspaceHome() {
  const user = await requireUser();
  const savings = await memberSavingsBalance(user.id);
  const invoices = await sql<{ status: string }[]>`SELECT status FROM contribution_invoices WHERE user_id = ${user.id}`;
  const projects = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM project_submissions WHERE submitter_id = ${user.id}`;
  let operating = 0n;
  try {
    operating = await poolBalance("operating");
  } catch {
    operating = 0n;
  }
  const status = user.membershipStatus ?? "draft";
  const statusTone = status === "active" ? "ok" : status === "suspended" ? "danger" : "warn";
  return (
    <>
      <p className="kicker">Member workspace</p>
      <h1>Good standing is earned, not assumed.</h1>
      <div className="grid-3">
        <article className="panel">
          <p className="kicker">Withdrawable savings</p>
          <p className="mono" style={{ fontSize: "1.6rem" }}>{formatNgn(savings.toString())}</p>
          <p className="muted">A claim on the savings pool — not a grant, loan, equity or project budget.</p>
        </article>
        <article className="panel">
          <p className="kicker">Membership</p>
          <p>
            <span className={`tag ${statusTone}`}>{prettyLabel(status)}</span>{" "}
            <span className="tag">{prettyLabel(user.membershipClass, "unclassified")}</span>
          </p>
          <p className="muted">{user.email}</p>
          <div className="panel-actions">
            <Link href="/workspace/card" className="btn ghost small">
              Digital card
            </Link>
          </div>
        </article>
        <article className="panel">
          <p className="kicker">Projects in flight</p>
          <p className="mono" style={{ fontSize: "1.6rem" }}>{projects[0]?.n ?? 0}</p>
          <p className="muted">Product briefs stay in diligence until a committee records a decision.</p>
          <div className="panel-actions">
            <Link href="/workspace/projects/new" className="btn ghost small">
              Submit a product
            </Link>
          </div>
        </article>
      </div>
      <div className="panel" style={{ marginTop: "1rem" }}>
        <p className="kicker">Fund separation</p>
        <p>Operating pool (cooperative, not your savings): {formatNgn(operating.toString())}. Open invoices: {invoices.filter((i) => i.status === "open").length}.</p>
      </div>
    </>
  );
}
