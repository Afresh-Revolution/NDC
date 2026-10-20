export type Frequency = "monthly" | "yearly";
export type PlanClass = "professional" | "associate";

export type PriceBook = {
  professionalMonthlyKobo: number;
  professionalYearlyKobo: number;
  associateMonthlyKobo: number;
  associateYearlyKobo: number;
  registrationKobo: number;
  graceDays: number;
};

export function lagosToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const monthIndex = m - 1 + months;
  const year = y + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(d, last);
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function addPeriod(iso: string, frequency: Frequency): string {
  return frequency === "yearly" ? addMonths(iso, 12) : addMonths(iso, 1);
}

export function planAmount(prices: PriceBook, plan: PlanClass, frequency: Frequency): number {
  if (plan === "professional") {
    return frequency === "yearly" ? prices.professionalYearlyKobo : prices.professionalMonthlyKobo;
  }
  return frequency === "yearly" ? prices.associateYearlyKobo : prices.associateMonthlyKobo;
}

export function invoiceKind(frequency: Frequency): "membership_monthly" | "membership_yearly" {
  return frequency === "yearly" ? "membership_yearly" : "membership_monthly";
}

/** Cycles that start on or before today, and before the cancellation date. */
export function cyclesToIssue(
  nextDue: string | null,
  today: string,
  frequency: Frequency,
  cancelledAt: string | null,
): string[] {
  if (!nextDue) return [];
  const due: string[] = [];
  let cursor = nextDue;
  let guard = 0;
  while (cursor <= today && guard < 36) {
    if (cancelledAt && cursor >= cancelledAt) break;
    due.push(cursor);
    cursor = addPeriod(cursor, frequency);
    guard += 1;
  }
  return due;
}

export function allocateOldest<T extends { amountKobo: number }>(invoices: T[], paymentKobo: number) {
  const settled: T[] = [];
  let left = paymentKobo;
  for (const invoice of invoices) {
    if (left < invoice.amountKobo) break;
    left -= invoice.amountKobo;
    settled.push(invoice);
  }
  return { settled, remainder: left, applied: paymentKobo - left };
}

export function arrearsKobo(unpaid: { amountKobo: number }[]): number {
  return unpaid.reduce((sum, invoice) => sum + invoice.amountKobo, 0);
}

export type MemberState = "pending" | "active" | "payment_due" | "overdue" | "suspended" | "cancelled";

export function memberState(input: {
  started: boolean;
  cancelled: boolean;
  suspended: boolean;
  open: { dueOn: string; amountKobo: number }[];
  today: string;
  graceDays: number;
}): MemberState {
  if (input.cancelled) return "cancelled";
  if (input.suspended) return "suspended";
  if (!input.started) return "pending";
  if (input.open.length === 0) return "active";
  const oldest = [...input.open].sort((a, b) => a.dueOn.localeCompare(b.dueOn))[0];
  const graceEnds = addDays(oldest.dueOn, input.graceDays);
  return input.today > graceEnds ? "overdue" : "payment_due";
}

export const STATE_LABEL: Record<MemberState, string> = {
  pending: "Pending registration",
  active: "Active",
  payment_due: "Payment due",
  overdue: "Overdue",
  suspended: "Suspended",
  cancelled: "Cancelled",
};
