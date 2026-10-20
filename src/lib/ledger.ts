import { sql } from "@/db";

export type JournalLineInput = {
  accountCode: string;
  memberId?: string | null;
  projectId?: string | null;
  fundPoolKind?: string | null;
  debitKobo?: number;
  creditKobo?: number;
  description?: string;
};

export async function accountIdByCode(code: string): Promise<string> {
  const rows = await sql<{ id: string }[]>`SELECT id FROM accounts WHERE code = ${code} LIMIT 1`;
  if (!rows[0]) throw new Error(`Unknown account code ${code}`);
  return rows[0].id;
}

export async function poolIdByKind(kind: string): Promise<string | null> {
  const rows = await sql<{ id: string }[]>`SELECT id FROM fund_pools WHERE kind = ${kind}::fund_pool_kind LIMIT 1`;
  return rows[0]?.id ?? null;
}

export async function memberSavingsBalance(userId: string): Promise<bigint> {
  const rows = await sql<{ balance: string }[]>`
    SELECT COALESCE(SUM(jl.credit_kobo) - SUM(jl.debit_kobo), 0)::text AS balance
    FROM journal_lines jl
    JOIN accounts a ON a.id = jl.account_id
    WHERE jl.member_id = ${userId} AND a.is_savings_liability = true
  `;
  return BigInt(rows[0]?.balance ?? "0");
}

export async function poolBalance(kind: string): Promise<bigint> {
  const rows = await sql<{ balance: string }[]>`
    SELECT COALESCE(
      SUM(CASE WHEN a.type IN ('asset') THEN jl.debit_kobo - jl.credit_kobo ELSE jl.credit_kobo - jl.debit_kobo END),
      0
    )::text AS balance
    FROM journal_lines jl
    JOIN accounts a ON a.id = jl.account_id
    JOIN fund_pools fp ON fp.id = COALESCE(jl.fund_pool_id, a.fund_pool_id)
    WHERE fp.kind = ${kind}::fund_pool_kind
  `;
  return BigInt(rows[0]?.balance ?? "0");
}

export async function postJournal(input: {
  memo: string;
  source: string;
  sourceId?: string | null;
  idempotencyKey: string;
  postedBy?: string | null;
  lines: JournalLineInput[];
}): Promise<{ id: string; duplicate: boolean }> {
  const existing = await sql<{ id: string }[]>`
    SELECT id FROM journal_entries WHERE idempotency_key = ${input.idempotencyKey} LIMIT 1
  `;
  if (existing[0]) return { id: existing[0].id, duplicate: true };

  const debit = input.lines.reduce((s, l) => s + (l.debitKobo ?? 0), 0);
  const credit = input.lines.reduce((s, l) => s + (l.creditKobo ?? 0), 0);
  if (debit !== credit) {
    throw new Error(`Unbalanced journal: debit ${debit} credit ${credit}`);
  }
  if (input.lines.length < 2) throw new Error("Journal requires at least two lines");

  const posted = await sql.begin(async (tx) => {
    const [entry] = await tx<{ id: string }[]>`
      INSERT INTO journal_entries (memo, source, source_id, idempotency_key, posted_by)
      VALUES (
        ${input.memo},
        ${input.source},
        ${input.sourceId ?? null},
        ${input.idempotencyKey},
        ${input.postedBy ?? null}
      )
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id
    `;
    if (!entry) {
      const [dup] = await tx<{ id: string }[]>`
        SELECT id FROM journal_entries WHERE idempotency_key = ${input.idempotencyKey}
      `;
      return { id: dup.id, duplicate: true as const };
    }

    for (const line of input.lines) {
      const accountId = await accountIdByCode(line.accountCode);
      const fundPoolId = line.fundPoolKind ? await poolIdByKind(line.fundPoolKind) : null;
      await tx`
        INSERT INTO journal_lines (
          entry_id, account_id, member_id, project_id, fund_pool_id,
          debit_kobo, credit_kobo, description
        ) VALUES (
          ${entry.id},
          ${accountId},
          ${line.memberId ?? null},
          ${line.projectId ?? null},
          ${fundPoolId},
          ${line.debitKobo ?? 0},
          ${line.creditKobo ?? 0},
          ${line.description ?? null}
        )
      `;
    }
    return { id: entry.id, duplicate: false as const };
  });

  return posted;
}

export async function reverseJournal(entryId: string, postedBy: string, reason: string) {
  const original = await sql<{ id: string; source: string; source_id: string | null }[]>`
    SELECT id, source, source_id FROM journal_entries WHERE id = ${entryId}
  `;
  if (!original[0]) throw new Error("Journal not found");
  const lines = await sql<{
    account_id: string;
    member_id: string | null;
    project_id: string | null;
    fund_pool_id: string | null;
    debit_kobo: string;
    credit_kobo: string;
    description: string | null;
  }[]>`
    SELECT account_id, member_id, project_id, fund_pool_id, debit_kobo::text, credit_kobo::text, description
    FROM journal_lines WHERE entry_id = ${entryId}
  `;

  const [reversal] = await sql<{ id: string }[]>`
    INSERT INTO journal_entries (memo, source, source_id, idempotency_key, posted_by, reverses_id)
    VALUES (
      ${reason},
      ${"reversal"},
      ${original[0].source_id},
      ${`reversal:${entryId}`},
      ${postedBy},
      ${entryId}
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id
  `;
  if (!reversal) return;

  for (const line of lines) {
    await sql`
      INSERT INTO journal_lines (
        entry_id, account_id, member_id, project_id, fund_pool_id, debit_kobo, credit_kobo, description
      ) VALUES (
        ${reversal.id},
        ${line.account_id},
        ${line.member_id},
        ${line.project_id},
        ${line.fund_pool_id},
        ${Number(line.credit_kobo)},
        ${Number(line.debit_kobo)},
        ${`Reversal: ${line.description ?? ""}`}
      )
    `;
  }

  await sql`UPDATE journal_entries SET reversed_by_id = ${reversal.id} WHERE id = ${entryId}`;
}
