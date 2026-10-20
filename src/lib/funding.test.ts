import { describe, expect, it } from "vitest";
import { SCORE_WEIGHTS, SCORE_THRESHOLD, weightedTotal } from "./funding";
import { formatNgn, nairaToKobo } from "./money";

describe("funding scorecard", () => {
  it("weights sum to 100", () => {
    expect(SCORE_WEIGHTS.reduce((s, w) => s + w.weight, 0)).toBe(100);
  });

  it("threshold is 70 and does not imply entitlement", () => {
    expect(SCORE_THRESHOLD).toBe(70);
  });

  it("computes a weighted total", () => {
    const scores = SCORE_WEIGHTS.map((w) => ({
      dimension: w.dimension,
      score: 80,
      weight_pct: w.weight,
    }));
    expect(weightedTotal(scores)).toBe(80);
  });
});

describe("money", () => {
  it("stores kobo as integer minor units", () => {
    expect(nairaToKobo(10_000)).toBe(1_000_000);
    expect(formatNgn(100000)).toContain("1");
  });
});
