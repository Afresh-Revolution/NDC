export const KOBO = 100;

export function nairaToKobo(naira: number): number {
  return Math.round(naira * KOBO);
}

export function koboToNaira(kobo: number | bigint | string | null | undefined): number {
  const n = Number(kobo ?? 0);
  return n / KOBO;
}

export function formatNgn(kobo: number | bigint | string | null | undefined): string {
  const naira = koboToNaira(kobo);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(naira);
}

export function parseNairaInput(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, "");
  const naira = Number(cleaned || 0);
  if (!Number.isFinite(naira) || naira < 0) return 0;
  return nairaToKobo(naira);
}
