import { sql } from "@/db";
import { requireUser } from "@/app/actions/auth";

export const metadata = { title: "Studio reviews" };

export default async function StudioReviewsPage() {
  const user = await requireUser();
  const rows = await sql<{ body: string; rating: number | null }[]>`
    SELECT body, rating FROM feedback WHERE user_id = ${user.id} AND related_type = 'studio'
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Delivery reviews</h1>
      <div className="panel">{rows.length === 0 ? "No reviews yet." : rows.map((r, i) => <p key={i}>{r.rating}/5 — {r.body}</p>)}</div>
    </>
  );
}
