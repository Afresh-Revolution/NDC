import { describe, expect, it } from "vitest";
import {
  addMonths,
  allocateOldest,
  arrearsKobo,
  cyclesToIssue,
  memberState,
  planAmount,
  type PriceBook,
} from "./membership-calc";

const prices: PriceBook = {
  professionalMonthlyKobo: 250_000,
  professionalYearlyKobo: 2_500_000,
  associateMonthlyKobo: 100_000,
  associateYearlyKobo: 1_000_000,
  registrationKobo: 500_000,
  graceDays: 7,
};

describe("membership billing", () => {
  it("prices professional and associate plans in kobo", () => {
    expect(planAmount(prices, "professional", "monthly")).toBe(250_000);
    expect(planAmount(prices, "professional", "yearly")).toBe(2_500_000);
    expect(planAmount(prices, "associate", "monthly")).toBe(100_000);
    expect(planAmount(prices, "associate", "yearly")).toBe(1_000_000);
  });

  it("keeps the day of month and clamps short months", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-01-15", 12)).toBe("2027-01-15");
  });

  it("sums unpaid invoices with no interest", () => {
    expect(arrearsKobo([{ amountKobo: 250_000 }, { amountKobo: 250_000 }, { amountKobo: 250_000 }])).toBe(750_000);
  });

  it("pays the oldest invoice first", () => {
    const { settled, remainder } = allocateOldest(
      [{ amountKobo: 500_000 }, { amountKobo: 250_000 }, { amountKobo: 250_000 }],
      750_000,
    );
    expect(settled.map((row) => row.amountKobo)).toEqual([500_000, 250_000]);
    expect(remainder).toBe(0);
  });

  it("stops issuing cycles once membership is cancelled", () => {
    expect(cyclesToIssue("2026-04-01", "2026-06-01", "monthly", "2026-04-01")).toEqual([]);
    expect(cyclesToIssue("2026-03-01", "2026-06-01", "monthly", "2026-04-15")).toEqual(["2026-03-01", "2026-04-01"]);
    expect(cyclesToIssue("2026-03-01", "2026-05-01", "monthly", null)).toEqual([
      "2026-03-01",
      "2026-04-01",
      "2026-05-01",
    ]);
  });

  it("moves from payment due to overdue only after the grace window", () => {
    const open = [{ dueOn: "2026-04-01", amountKobo: 250_000 }];
    expect(memberState({ started: true, cancelled: false, suspended: false, open, today: "2026-04-08", graceDays: 7 })).toBe(
      "payment_due",
    );
    expect(memberState({ started: true, cancelled: false, suspended: false, open, today: "2026-04-09", graceDays: 7 })).toBe(
      "overdue",
    );
    expect(memberState({ started: true, cancelled: true, suspended: false, open, today: "2026-06-01", graceDays: 7 })).toBe(
      "cancelled",
    );
  });
});
