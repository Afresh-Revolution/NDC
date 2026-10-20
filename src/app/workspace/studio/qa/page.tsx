import { sql } from "@/db";

export const metadata = { title: "QA" };

export default async function QaPage() {
  const rows = await sql<{ result: string; notes: string | null }[]>`SELECT result, notes FROM qa_reviews ORDER BY created_at DESC`;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>QA and acceptance</h1>
      <div className="panel">{rows.length === 0 ? "No QA reviews." : rows.map((r, i) => <p key={i}>{r.result} — {r.notes}</p>)}</div>
    </>
  );
}
