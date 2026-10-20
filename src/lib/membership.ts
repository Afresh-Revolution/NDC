import { sql } from "@/db";
import { randomToken } from "@/lib/crypto";
import { env } from "@/lib/env";
import { postJournal } from "@/lib/ledger";
import { sendMail, transactionalHtml } from "@/lib/mail";
import {
  addDays,
  addPeriod,
  allocateOldest,
  arrearsKobo,
  cyclesToIssue,
  invoiceKind,
  lagosToday,
  memberState,
  planAmount,
  STATE_LABEL,
  type Frequency,
  type MemberState,
  type PlanClass,
  type PriceBook,
} from "@/lib/membership-calc";

type SettingsRow = {
  professional_monthly_kobo: number;
  professional_yearly_kobo: number;
  associate_monthly_kobo: number;
  associate_yearly_kobo: number;
  registration_kobo: number;
  grace_days: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  notify_email: string;
};

type SubRow = {
  id: string;
  user_id: string;
  membership_id: string | null;
  class: PlanClass;
  frequency: Frequency;
  pending_frequency: Frequency | null;
  started_at: string | null;
  period_start: string | null;
  period_end: string | null;
  next_due: string | null;
  cancelled_at: string | null;
};

type InvoiceRow = {
  id: string;
  kind: string;
  period: string | null;
  amount_kobo: number;
  status: string;
  reference: string;
  description: string | null;
  due_at: string | null;
  created_at: string;
};

function pricesOf(row: SettingsRow): PriceBook {
  return {
    professionalMonthlyKobo: row.professional_monthly_kobo,
    professionalYearlyKobo: row.professional_yearly_kobo,
    associateMonthlyKobo: row.associate_monthly_kobo,
    associateYearlyKobo: row.associate_yearly_kobo,
    registrationKobo: row.registration_kobo,
    graceDays: row.grace_days,
  };
}

function dateOnly(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

export async function getMembershipSettings() {
  const [row] = await sql<SettingsRow[]>`SELECT * FROM membership_settings WHERE id = 1`;
  if (!row) throw new Error("Membership settings are missing. Apply the database schema.");
  return { ...row, prices: pricesOf(row) };
}

export async function saveMembershipSettings(input: {
  professionalMonthly: number;
  professionalYearly: number;
  associateMonthly: number;
  associateYearly: number;
  registration: number;
  graceDays: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  notifyEmail: string;
}) {
  await sql`
    UPDATE membership_settings SET
      professional_monthly_kobo = ${input.professionalMonthly},
      professional_yearly_kobo = ${input.professionalYearly},
      associate_monthly_kobo = ${input.associateMonthly},
      associate_yearly_kobo = ${input.associateYearly},
      registration_kobo = ${input.registration},
      grace_days = ${input.graceDays},
      bank_name = ${input.bankName},
      account_name = ${input.accountName},
      account_number = ${input.accountNumber},
      notify_email = ${input.notifyEmail}
    WHERE id = 1
  `;
}

async function openInvoices(userId: string) {
  return sql<InvoiceRow[]>`
    SELECT id, kind, period::text, amount_kobo, status, reference, description, due_at::text, created_at::text
    FROM contribution_invoices
    WHERE user_id = ${userId}
      AND status = 'open'
      AND kind IN ('registration', 'membership_monthly', 'membership_yearly')
    ORDER BY period NULLS FIRST, created_at
  `;
}

export async function membershipSnapshot(userId: string) {
  const settings = await getMembershipSettings();
  const [sub] = await sql<SubRow[]>`
    SELECT id, user_id, membership_id, class, frequency, pending_frequency,
           started_at::text, period_start::text, period_end::text, next_due::text, cancelled_at::text
    FROM membership_subscriptions WHERE user_id = ${userId}
  `;
  const [membership] = await sql<{ status: string }[]>`
    SELECT status::text FROM memberships WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
  `;
  const open = await openInvoices(userId);
  const history = await sql<InvoiceRow[]>`
    SELECT id, kind, period::text, amount_kobo, status, reference, description, due_at::text, created_at::text
    FROM contribution_invoices
    WHERE user_id = ${userId} AND kind IN ('registration', 'membership_monthly', 'membership_yearly')
    ORDER BY created_at DESC
    LIMIT 24
  `;
  const today = lagosToday();
  const state = memberState({
    started: Boolean(sub?.started_at),
    cancelled: sub ? Boolean(sub.cancelled_at) : membership?.status === "resigned",
    suspended: membership?.status === "paused",
    open: open.map((invoice) => ({ dueOn: dateOnly(invoice.due_at) ?? dateOnly(invoice.period) ?? today, amountKobo: invoice.amount_kobo })),
    today,
    graceDays: settings.grace_days,
  });
  return {
    settings,
    sub: sub
      ? {
          ...sub,
          started_at: dateOnly(sub.started_at),
          period_start: dateOnly(sub.period_start),
          period_end: dateOnly(sub.period_end),
          next_due: dateOnly(sub.next_due),
          cancelled_at: dateOnly(sub.cancelled_at),
        }
      : null,
    open,
    history,
    outstandingKobo: arrearsKobo(open.map((invoice) => ({ amountKobo: Number(invoice.amount_kobo) }))),
    state,
    label: STATE_LABEL[state],
    today,
  };
}

async function ensureMembership(userId: string, plan: PlanClass) {
  const cls = plan === "professional" ? "full_professional" : "associate_student";
  const [existing] = await sql<{ id: string }[]>`
    SELECT id FROM memberships WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
  `;
  if (existing) {
    await sql`
      UPDATE memberships
      SET class = ${cls}::membership_class
      WHERE id = ${existing.id}
    `;
    return existing.id;
  }
  const [created] = await sql<{ id: string }[]>`
    INSERT INTO memberships (user_id, class, status)
    VALUES (${userId}, ${cls}::membership_class, 'payment_pending')
    RETURNING id
  `;
  return created.id;
}

async function insertCycleInvoice(userId: string, plan: PlanClass, frequency: Frequency, period: string, amount: number) {
  const kind = invoiceKind(frequency);
  const reference = `NDC-SUB-${randomToken(6)}`;
  const label = frequency === "yearly" ? "Yearly" : "Monthly";
  const who = plan === "professional" ? "Professional" : "Associate";
  await sql`
    INSERT INTO contribution_invoices (user_id, kind, period, amount_kobo, status, due_at, reference, description)
    VALUES (
      ${userId},
      ${kind},
      ${period},
      ${amount},
      'open',
      ${period},
      ${reference},
      ${`${who} ${label.toLowerCase()} membership · ${period}`}
    )
    ON CONFLICT DO NOTHING
  `;
}

export async function choosePlan(userId: string, plan: PlanClass, frequency: Frequency) {
  const settings = await getMembershipSettings();
  const [existing] = await sql<SubRow[]>`
    SELECT id, started_at::text, cancelled_at::text FROM membership_subscriptions WHERE user_id = ${userId}
  `;
  if (existing?.started_at) {
    throw new Error("Membership already started. Cancelling stops new invoices; it does not remove what is already due.");
  }
  const membershipId = await ensureMembership(userId, plan);
  await sql`
    UPDATE contribution_invoices
    SET status = 'void'
    WHERE user_id = ${userId}
      AND status = 'open'
      AND kind IN ('registration', 'membership_monthly', 'membership_yearly')
  `;
  const today = lagosToday();
  if (plan === "professional") {
    const [paidReg] = await sql<{ id: string }[]>`
      SELECT id FROM contribution_invoices
      WHERE user_id = ${userId} AND kind = 'registration' AND status = 'paid'
      LIMIT 1
    `;
    if (!paidReg && settings.registration_kobo > 0) {
      await sql`
        INSERT INTO contribution_invoices (user_id, kind, amount_kobo, status, due_at, reference, description)
        VALUES (
          ${userId},
          'registration',
          ${settings.registration_kobo},
          'open',
          ${today},
          ${`NDC-REG-${randomToken(6)}`},
          'One-time professional registration'
        )
        ON CONFLICT DO NOTHING
      `;
    }
  }
  await insertCycleInvoice(userId, plan, frequency, today, planAmount(settings.prices, plan, frequency));
  if (existing) {
    await sql`
      UPDATE membership_subscriptions
      SET class = ${plan},
          frequency = ${frequency},
          pending_frequency = NULL,
          membership_id = ${membershipId},
          started_at = NULL,
          period_start = NULL,
          period_end = NULL,
          next_due = NULL,
          cancelled_at = NULL
      WHERE user_id = ${userId}
    `;
  } else {
    await sql`
      INSERT INTO membership_subscriptions (user_id, membership_id, class, frequency)
      VALUES (${userId}, ${membershipId}, ${plan}, ${frequency})
    `;
  }
  await syncMembershipStatus(userId);
}

export async function scheduleFrequency(userId: string, frequency: Frequency) {
  const [sub] = await sql<{ started_at: string | null; cancelled_at: string | null }[]>`
    SELECT started_at::text, cancelled_at::text FROM membership_subscriptions WHERE user_id = ${userId}
  `;
  if (!sub?.started_at || sub.cancelled_at) throw new Error("Choose a plan before changing frequency.");
  await sql`UPDATE membership_subscriptions SET pending_frequency = ${frequency} WHERE user_id = ${userId}`;
}

export async function cancelMembership(userId: string) {
  const today = lagosToday();
  const [sub] = await sql<{ id: string }[]>`SELECT id FROM membership_subscriptions WHERE user_id = ${userId}`;
  if (!sub) throw new Error("No membership to cancel.");
  await sql`
    UPDATE membership_subscriptions
    SET cancelled_at = ${today}
    WHERE user_id = ${userId} AND cancelled_at IS NULL
  `;
  await sql`
    UPDATE memberships SET status = 'resigned'
    WHERE user_id = ${userId} AND status IN ('draft', 'submitted', 'payment_pending', 'under_review', 'active', 'arrears', 'paused', 'appealing')
  `;
}

async function syncMembershipStatus(userId: string) {
  const snap = await membershipSnapshot(userId);
  const map: Record<MemberState, string> = {
    pending: "payment_pending",
    active: "active",
    payment_due: "payment_pending",
    overdue: "arrears",
    suspended: "paused",
    cancelled: "resigned",
  };
  if (snap.state === "suspended") return;
  await sql`
    UPDATE memberships
    SET status = ${map[snap.state]}::membership_status,
        joined_at = CASE WHEN ${snap.state} = 'active' AND joined_at IS NULL THEN now() ELSE joined_at END
    WHERE user_id = ${userId}
      AND status <> 'denied'
  `;
}

async function startCycle(userId: string) {
  const [sub] = await sql<SubRow[]>`
    SELECT id, class, frequency, started_at::text, cancelled_at::text
    FROM membership_subscriptions WHERE user_id = ${userId}
  `;
  if (!sub || sub.started_at || sub.cancelled_at) return;
  const open = await openInvoices(userId);
  if (open.length > 0) return;
  const [paidCycle] = await sql<{ period: string }[]>`
    SELECT period::text FROM contribution_invoices
    WHERE user_id = ${userId} AND status = 'paid' AND kind IN ('membership_monthly', 'membership_yearly')
    ORDER BY period DESC NULLS LAST LIMIT 1
  `;
  if (!paidCycle?.period) return;
  const start = lagosToday();
  const next = addPeriod(start, sub.frequency);
  await sql`
    UPDATE membership_subscriptions
    SET started_at = ${start},
        period_start = ${start},
        period_end = ${addDays(next, -1)},
        next_due = ${next}
    WHERE user_id = ${userId} AND cancelled_at IS NULL
  `;
  await sql`
    UPDATE memberships SET status = 'active', joined_at = COALESCE(joined_at, now())
    WHERE user_id = ${userId} AND status <> 'denied'
  `;
}

export async function settleMembershipPayment(input: {
  userId: string;
  amountKobo: number;
  provider: string;
  providerRef: string;
  intentId?: string | null;
}) {
  const [already] = await sql<{ id: string }[]>`SELECT id FROM payments WHERE provider_ref = ${input.providerRef}`;
  if (already) return { duplicate: true as const, applied: 0 };

  const open = await openInvoices(input.userId);
  const ordered = open.map((invoice) => ({ ...invoice, amountKobo: Number(invoice.amount_kobo) }));
  const { settled, applied, remainder } = allocateOldest(ordered, input.amountKobo);
  if (applied <= 0) throw new Error("Payment does not cover the oldest open membership invoice.");
  if (remainder > 0) throw new Error("Payment is higher than the open membership invoices.");

  const posted = await postJournal({
    memo: `Membership payment ${input.providerRef}`,
    source: "membership_fee",
    sourceId: input.userId,
    idempotencyKey: `membership:${input.provider}:${input.providerRef}`,
    postedBy: input.userId,
    lines: [
      {
        accountCode: input.provider === "paystack" ? "1110" : "1100",
        debitKobo: applied,
        fundPoolKind: "operating",
        description: "Membership fee received",
      },
      { accountCode: "4100", creditKobo: applied, description: "Membership dues revenue" },
    ],
  });

  for (const invoice of settled) {
    await sql`UPDATE contribution_invoices SET status = 'paid' WHERE id = ${invoice.id} AND status = 'open'`;
  }
  await sql`
    INSERT INTO payments (intent_id, user_id, provider, provider_ref, amount_kobo, status, paid_at, journal_entry_id)
    VALUES (
      ${input.intentId ?? null},
      ${input.userId},
      ${input.provider},
      ${input.providerRef},
      ${applied},
      'success',
      now(),
      ${posted.id}
    )
    ON CONFLICT (provider_ref) DO NOTHING
  `;
  await startCycle(input.userId);
  await syncMembershipStatus(input.userId);
  return { duplicate: false as const, applied, settled: settled.length };
}

export async function beginPaystack(userId: string, email: string) {
  if (!env.paystackSecret) throw new Error("Paystack is not configured.");
  const open = await openInvoices(userId);
  const total = arrearsKobo(open.map((invoice) => ({ amountKobo: Number(invoice.amount_kobo) })));
  if (total <= 0) throw new Error("Nothing is due.");
  const reference = `NDC-SUB-${randomToken(8)}`;
  await sql`
    INSERT INTO payment_intents (user_id, provider, provider_ref, amount_kobo, status, idempotency_key, metadata)
    VALUES (
      ${userId},
      'paystack',
      ${reference},
      ${total},
      'initialized',
      ${`paystack:${reference}`},
      ${sql.json({ invoiceIds: open.map((invoice) => invoice.id), purpose: "membership" })}
    )
  `;
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.paystackSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: total,
      reference,
      callback_url: `${env.appUrl}/workspace/membership`,
      metadata: { purpose: "membership" },
    }),
  });
  const body = (await response.json()) as { status?: boolean; message?: string; data?: { authorization_url?: string } };
  if (!response.ok || !body.data?.authorization_url) {
    throw new Error(body.message || "Paystack could not start the payment.");
  }
  return body.data.authorization_url;
}

export async function confirmPaystackReference(reference: string) {
  if (!env.paystackSecret || !reference.startsWith("NDC-SUB-")) return null;
  const [intent] = await sql<{ id: string; user_id: string; amount_kobo: number; status: string }[]>`
    SELECT id, user_id, amount_kobo, status FROM payment_intents WHERE provider_ref = ${reference}
  `;
  if (!intent) return null;
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${env.paystackSecret}` },
  });
  const body = (await response.json()) as { data?: { status?: string; amount?: number } };
  if (body.data?.status !== "success") return null;
  const paid = Number(body.data.amount ?? 0);
  if (paid < intent.amount_kobo) throw new Error("Paystack amount is lower than the invoice total.");
  await sql`UPDATE payment_intents SET status = 'success' WHERE id = ${intent.id}`;
  return settleMembershipPayment({
    userId: intent.user_id,
    amountKobo: intent.amount_kobo,
    provider: "paystack",
    providerRef: reference,
    intentId: intent.id,
  });
}

export async function submitManualPayment(userId: string, transferReference: string) {
  const ref = transferReference.trim();
  if (ref.length < 4) throw new Error("Enter the transfer reference from your bank.");
  const settings = await getMembershipSettings();
  if (!settings.account_number) throw new Error("Manual transfer is not available until an account number is set.");
  const open = await openInvoices(userId);
  const total = arrearsKobo(open.map((invoice) => ({ amountKobo: Number(invoice.amount_kobo) })));
  if (total <= 0) throw new Error("Nothing is due.");
  const [pending] = await sql<{ id: string }[]>`
    SELECT id FROM manual_payments WHERE user_id = ${userId} AND status = 'pending' LIMIT 1
  `;
  if (pending) throw new Error("A manual payment is already waiting for approval.");
  await sql`
    INSERT INTO manual_payments (user_id, amount_kobo, transfer_reference)
    VALUES (${userId}, ${total}, ${ref})
  `;
  const [user] = await sql<{ email: string; display_name: string | null }[]>`
    SELECT u.email, p.display_name
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ${userId}
  `;
  const who = user?.display_name || user?.email || userId;
  await sendMail(
    settings.notify_email || "williambosworth777@icloud.com",
    "Manual membership payment waiting approval",
    transactionalHtml(
      "Manual payment waiting",
      `<p><strong>${who}</strong> submitted a bank transfer for membership.</p>
       <p>Reference: ${ref}<br/>Amount due: ₦${(total / 100).toLocaleString("en-NG")}</p>
       <p>Approve it from the admin membership page. The billing cycle starts only after approval.</p>`,
    ),
  );
}

export async function reviewManualPayment(adminId: string, paymentId: string, approve: boolean) {
  const [payment] = await sql<{ id: string; user_id: string; amount_kobo: number; transfer_reference: string; status: string }[]>`
    SELECT id, user_id, amount_kobo, transfer_reference, status FROM manual_payments WHERE id = ${paymentId}
  `;
  if (!payment || (payment.status !== "pending" && payment.status !== "rejected")) {
    throw new Error("That payment is not waiting.");
  }
  if (!approve) {
    await sql`
      UPDATE manual_payments
      SET status = 'rejected', reviewed_by = ${adminId}, reviewed_at = now()
      WHERE id = ${payment.id}
    `;
    return;
  }
  const reference = `MANUAL-${payment.id}`;
  await settleMembershipPayment({
    userId: payment.user_id,
    amountKobo: Number(payment.amount_kobo),
    provider: "manual",
    providerRef: reference,
  });
  await sql`
    UPDATE manual_payments
    SET status = 'approved', reviewed_by = ${adminId}, reviewed_at = now()
    WHERE id = ${payment.id}
  `;
  const [user] = await sql<{ email: string }[]>`SELECT email FROM users WHERE id = ${payment.user_id}`;
  if (user) {
    try {
      await sendMail(
        user.email,
        "Membership payment approved",
        transactionalHtml(
          "Membership is active",
          "<p>Your transfer was approved. Membership has started and the next due date is set from today.</p>",
        ),
      );
    } catch (error) {
      console.error("[mail] approval notice failed", error);
    }
  }
}

export async function setMembershipSuspended(userId: string, suspended: boolean) {
  await sql`
    UPDATE memberships
    SET status = ${suspended ? "paused" : "active"}::membership_status
    WHERE user_id = ${userId}
  `;
  if (!suspended) await syncMembershipStatus(userId);
}

export async function runMembershipBilling() {
  const today = lagosToday();
  const settings = await getMembershipSettings();
  const subs = await sql<SubRow[]>`
    SELECT id, user_id, class, frequency, pending_frequency,
           started_at::text, next_due::text, cancelled_at::text
    FROM membership_subscriptions
    WHERE started_at IS NOT NULL AND cancelled_at IS NULL
  `;
  let issued = 0;
  for (const sub of subs) {
    let frequency = sub.frequency;
    const nextDue = dateOnly(sub.next_due);
    if (sub.pending_frequency && nextDue && nextDue <= today) {
      frequency = sub.pending_frequency;
      await sql`
        UPDATE membership_subscriptions
        SET frequency = ${frequency}, pending_frequency = NULL
        WHERE id = ${sub.id}
      `;
    }
    const cycles = cyclesToIssue(nextDue, today, frequency, null);
    for (const period of cycles) {
      const before = await sql<{ id: string }[]>`
        SELECT id FROM contribution_invoices
        WHERE user_id = ${sub.user_id} AND kind = ${invoiceKind(frequency)} AND period = ${period}
      `;
      await insertCycleInvoice(sub.user_id, sub.class, frequency, period, planAmount(settings.prices, sub.class, frequency));
      if (!before[0]) issued += 1;
      const following = addPeriod(period, frequency);
      await sql`
        UPDATE membership_subscriptions
        SET period_start = ${period},
            period_end = ${addDays(following, -1)},
            next_due = ${following},
            frequency = ${frequency}
        WHERE id = ${sub.id}
      `;
    }
    await syncMembershipStatus(sub.user_id);
    await sendDueReminders(sub.user_id, settings.grace_days, today);
    const upcoming = dateOnly(sub.next_due);
    if (upcoming && upcoming > today && upcoming <= addDays(today, 3)) {
      await sendOnce(
        sub.user_id,
        `${sub.user_id}:upcoming:${upcoming}`,
        "Membership renewal is coming up",
        `<p>Your next membership charge is due on ${upcoming}. It is separate from savings.</p>`,
      );
    }
  }
  return { issued, checked: subs.length, today };
}

async function sendOnce(userId: string, key: string, title: string, body: string) {
  const [sent] = await sql<{ reminder_key: string }[]>`
    INSERT INTO membership_reminders (reminder_key, user_id)
    VALUES (${key}, ${userId})
    ON CONFLICT (reminder_key) DO NOTHING
    RETURNING reminder_key
  `;
  if (!sent) return;
  const [user] = await sql<{ email: string }[]>`SELECT email FROM users WHERE id = ${userId}`;
  if (!user) return;
  await sendMail(user.email, title, transactionalHtml(title, body));
}

async function sendDueReminders(userId: string, graceDays: number, today: string) {
  const open = await openInvoices(userId);
  for (const invoice of open) {
    const due = dateOnly(invoice.due_at) ?? dateOnly(invoice.period);
    if (!due) continue;
    const kind = today > addDays(due, graceDays) ? "overdue" : today >= due ? "due" : null;
    if (!kind) continue;
    const title = kind === "overdue" ? "Membership payment is overdue" : "Membership payment is due";
    await sendOnce(
      userId,
      `${invoice.id}:${kind}`,
      title,
      `<p>${invoice.description ?? "Membership dues"} is ${kind === "overdue" ? "past the grace period" : "due"}. Pay from your membership page. Unpaid dues are not taken from savings.</p>`,
    );
  }
}

export async function listManualQueue() {
  return sql<{
    id: string;
    user_id: string;
    amount_kobo: number;
    transfer_reference: string;
    status: string;
    created_at: string;
    email: string;
    display_name: string | null;
  }[]>`
    SELECT m.id, m.user_id, m.amount_kobo, m.transfer_reference, m.status, m.created_at::text,
           u.email, p.display_name
    FROM manual_payments m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN profiles p ON p.user_id = m.user_id
    ORDER BY CASE WHEN m.status = 'pending' THEN 0 ELSE 1 END, m.created_at DESC
    LIMIT 50
  `;
}

export async function listMembershipBalances() {
  return sql<{ user_id: string; email: string; display_name: string | null; outstanding: number; status: string; class: string | null }[]>`
    SELECT u.id AS user_id, u.email, p.display_name,
           COALESCE(SUM(i.amount_kobo) FILTER (WHERE i.status = 'open'), 0)::int AS outstanding,
           COALESCE(ms.status::text, 'none') AS status,
           s.class
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN membership_subscriptions s ON s.user_id = u.id
    LEFT JOIN memberships ms ON ms.user_id = u.id
    LEFT JOIN contribution_invoices i ON i.user_id = u.id
      AND i.kind IN ('registration', 'membership_monthly', 'membership_yearly')
    WHERE s.id IS NOT NULL
    GROUP BY u.id, u.email, p.display_name, ms.status, s.class
    ORDER BY outstanding DESC
    LIMIT 100
  `;
}
