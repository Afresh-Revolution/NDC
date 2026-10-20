import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { sql } from "@/db";
import { env } from "@/lib/env";
import { postJournal } from "@/lib/ledger";
import { memberSavingsBalance } from "@/lib/ledger";
import { settleMembershipPayment } from "@/lib/membership";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = env.paystackWebhook || env.paystackSecret
    ? createHmac("sha512", env.paystackWebhook || env.paystackSecret).update(raw).digest("hex")
    : "";
  const signatureOk = Boolean(expected) && signature === expected;

  let payload: { event?: string; data?: Record<string, unknown> };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventId = String(payload.data?.id ?? payload.data?.reference ?? crypto.randomUUID());
  const eventType = String(payload.event ?? "unknown");
  const idempotencyKey = `paystack:${eventId}:${eventType}`;

  try {
    await sql`
      INSERT INTO webhooks (provider, event_id, event_type, signature_ok, payload, idempotency_key)
      VALUES ('paystack', ${eventId}, ${eventType}, ${signatureOk}, ${sql.json(payload as never)}, ${idempotencyKey})
    `;
  } catch {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (!signatureOk) {
    await sql`UPDATE webhooks SET error = 'bad signature' WHERE idempotency_key = ${idempotencyKey}`;
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (eventType === "charge.success") {
    const reference = String(payload.data?.reference ?? "");
    const amount = Number(payload.data?.amount ?? 0);
    const invoice = (await sql<{ id: string; user_id: string; kind: string; amount_kobo: number }[]>`
      SELECT id, user_id, kind, amount_kobo FROM contribution_invoices WHERE reference = ${reference} LIMIT 1
    `)[0];
    if (invoice) {
      const savings = invoice.kind === "monthly_savings";
      const posted = await postJournal({
        memo: `Paystack ${reference}`,
        source: savings ? "member_savings" : "membership_fee",
        sourceId: invoice.id,
        idempotencyKey: `payment:${reference}`,
        lines: [
          { accountCode: "1110", debitKobo: amount, fundPoolKind: savings ? "member_savings" : "operating" },
          {
            accountCode: savings ? "2100" : "4100",
            creditKobo: amount,
            memberId: invoice.user_id,
            fundPoolKind: savings ? "member_savings" : "operating",
          },
        ],
      });
      await sql`
        INSERT INTO payments (intent_id, user_id, provider, provider_ref, amount_kobo, status, paid_at, journal_entry_id, raw)
        VALUES (null, ${invoice.user_id}, 'paystack', ${reference}, ${amount}, 'success', now(), ${posted.id}, ${sql.json(payload as never)})
        ON CONFLICT (provider_ref) DO NOTHING
      `;
      await sql`UPDATE contribution_invoices SET status = 'paid' WHERE id = ${invoice.id}`;
      if (savings) {
        const bal = await memberSavingsBalance(invoice.user_id);
        await sql`
          INSERT INTO savings_claims (user_id, balance_kobo, last_posted_at)
          VALUES (${invoice.user_id}, ${bal.toString()}, now())
          ON CONFLICT (user_id) DO UPDATE SET balance_kobo = ${bal.toString()}, last_posted_at = now()
        `;
      }
    } else if (reference.startsWith("NDC-SUB-")) {
      const intent = (await sql<{ id: string; user_id: string; amount_kobo: number }[]>`
        SELECT id, user_id, amount_kobo FROM payment_intents WHERE provider_ref = ${reference} LIMIT 1
      `)[0];
      if (intent && amount >= Number(intent.amount_kobo)) {
        await sql`UPDATE payment_intents SET status = 'success' WHERE id = ${intent.id}`;
        await settleMembershipPayment({
          userId: intent.user_id,
          amountKobo: Number(intent.amount_kobo),
          provider: "paystack",
          providerRef: reference,
          intentId: intent.id,
        });
      }
    }
  }

  await sql`UPDATE webhooks SET processed_at = now() WHERE idempotency_key = ${idempotencyKey}`;
  return NextResponse.json({ ok: true, duplicate: false });
}
