import { sql } from "@/db";

export const metadata = { title: "Delivery" };

export default async function DeliveryPage() {
  const rows = await sql<{ title: string; status: string }[]>`SELECT title, status FROM deliverables ORDER BY due_at`;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Deliverables</h1>
      <div className="panel">{rows.length === 0 ? "No deliverables." : rows.map((r, i) => <p key={i}>{r.title} · {r.status}</p>)}</div>
    </>
  );
}
