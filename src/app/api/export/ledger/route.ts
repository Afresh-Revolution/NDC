import { NextResponse } from "next/server";
import { currentUser, can, mfaPending } from "@/lib/auth";
import { sql } from "@/db";

export async function GET() {
  const user = await currentUser();
  if (mfaPending(user) || !can(user, "finance.export")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await sql<{
    entry_no: string;
    posted_at: string;
    memo: string;
    source: string;
    account: string;
    debit: string;
    credit: string;
    member: string | null;
  }[]>`
    SELECT je.entry_no::text, je.posted_at::text, je.memo, je.source, a.code AS account,
           jl.debit_kobo::text AS debit, jl.credit_kobo::text AS credit, jl.member_id::text AS member
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.entry_id
    JOIN accounts a ON a.id = jl.account_id
    ORDER BY je.entry_no, jl.id
  `;
  const header = "entry_no,posted_at,memo,source,account,debit_kobo,credit_kobo,member_id";
  const csv = [header, ...rows.map((r) =>
    [r.entry_no, r.posted_at, JSON.stringify(r.memo), r.source, r.account, r.debit, r.credit, r.member ?? ""].join(","),
  )].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=ndc-ledger.csv",
    },
  });
}
