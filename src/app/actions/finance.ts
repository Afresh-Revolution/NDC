"use server";

import { sql } from "@/db";
import { requireUser } from "@/app/actions/auth";
import { memberSavingsBalance, postJournal } from "@/lib/ledger";
import { randomToken } from "@/lib/crypto";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { parseNairaInput } from "@/lib/money";

export async function requestContributionInvoice(formData: FormData) {
  const user = await requireUser();
  const amount = parseNairaInput(String(formData.get("amount") ?? "0"));
  if (amount <= 0) throw new Error("Enter a positive amount");
  const reference = `NDC-SAV-${randomToken(6)}`;
  await sql`
    INSERT INTO contribution_invoices (user_id, kind, amount_kobo, status, reference, description, period)
    VALUES (
      ${user.id}, 'monthly_savings', ${amount}, 'open', ${reference},
      'Member savings contribution — recorded as a withdrawable claim, not operating revenue.',
      ${new Date().toISOString().slice(0, 10)}
    )
  `;
  await audit({ actorId: user.id, action: "invoice.create", entity: "contribution_invoices", entityId: user.id });
  redirect("/workspace/contributions");
}

export async function simulatePayment(formData: FormData) {
  const user = await requireUser();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const invoice = (await sql<{ id: string; amount_kobo: number; reference: string; kind: string }[]>`
    SELECT id, amount_kobo, reference, kind FROM contribution_invoices
    WHERE id = ${invoiceId} AND user_id = ${user.id} AND status = 'open'
  `)[0];
  if (!invoice) throw new Error("Invoice not found");

  const idempotencyKey = `payment:${invoice.reference}`;
  const source = invoice.kind === "monthly_savings" ? "member_savings" : "membership_fee";
  const creditAccount = invoice.kind === "monthly_savings" ? "2100" : "4100";
  const creditPool = invoice.kind === "monthly_savings" ? "member_savings" : "operating";

  const posted = await postJournal({
    memo: `Payment ${invoice.reference}`,
    source,
    sourceId: invoice.id,
    idempotencyKey,
    postedBy: user.id,
    lines: [
      { accountCode: "1110", debitKobo: invoice.amount_kobo, fundPoolKind: creditPool, description: "Processor clearing" },
      {
        accountCode: creditAccount,
        creditKobo: invoice.amount_kobo,
        memberId: user.id,
        fundPoolKind: creditPool,
        description: invoice.kind,
      },
    ],
  });

  await sql`
    INSERT INTO payments (user_id, provider, provider_ref, amount_kobo, status, paid_at, journal_entry_id)
    VALUES (${user.id}, 'sandbox', ${invoice.reference}, ${invoice.amount_kobo}, 'success', now(), ${posted.id})
    ON CONFLICT (provider_ref) DO NOTHING
  `;
  await sql`UPDATE contribution_invoices SET status = 'paid' WHERE id = ${invoice.id}`;
  const bal = await memberSavingsBalance(user.id);
  await sql`
    INSERT INTO savings_claims (user_id, balance_kobo, last_posted_at)
    VALUES (${user.id}, ${bal.toString()}, now())
    ON CONFLICT (user_id) DO UPDATE SET balance_kobo = ${bal.toString()}, last_posted_at = now()
  `;
  redirect("/workspace/statement");
}

export async function requestWithdrawal(formData: FormData) {
  const user = await requireUser();
  const amount = parseNairaInput(String(formData.get("amount") ?? "0"));
  const bank = String(formData.get("bank") ?? "");
  const nuban = String(formData.get("nuban") ?? "");
  const balance = await memberSavingsBalance(user.id);
  if (amount <= 0 || BigInt(amount) > balance) throw new Error("Amount exceeds withdrawable savings");
  await sql`
    INSERT INTO withdrawals (user_id, amount_kobo, status, destination_bank, destination_nuban, eligibility_note)
    VALUES (
      ${user.id}, ${amount}, 'requested', ${bank}, ${nuban},
      'Subject to bylaws, liquidity planning and dual-control approval. Savings are not confiscated for project losses.'
    )
  `;
  await audit({ actorId: user.id, action: "withdrawal.request", entity: "withdrawals", entityId: user.id });
  redirect("/workspace/withdrawals");
}
