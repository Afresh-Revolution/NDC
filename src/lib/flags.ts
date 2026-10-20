import { sql } from "@/db";
import { env } from "@/lib/env";

export async function flagEnabled(key: string): Promise<boolean> {
  const envMap: Record<string, boolean> = {
    loans: env.featureLoans,
    investment: env.featureInvestment,
    disbursement: env.featureDisbursement,
    public_equity_portal: env.featurePublicEquity,
  };
  if (key in envMap && envMap[key] === false) return false;
  const rows = await sql<{ enabled: boolean }[]>`
    SELECT enabled FROM feature_flags WHERE key = ${key} LIMIT 1
  `;
  if (rows[0]) return rows[0].enabled;
  return envMap[key] ?? false;
}
