import { PageHero } from "@/components/PageHero";
import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Opportunities" };

export default async function OpportunitiesPage() {
  let rows: { id: string; title: string; brief: string; budget_kobo: number | null }[] = [];
  try {
    rows = await sql`
      SELECT id, title, brief, budget_kobo FROM opportunities
      WHERE is_public = true AND status = 'open'
      ORDER BY created_at DESC
    `;
  } catch {
    rows = [];
  }
  return (
    <>
      <PageHero
        kicker="Studio board"
        title="Work is matched, not handed out."
        lede="Public opportunities are optional. Applying does not guarantee selection. Compensation is contracted, not deducted silently from savings."
      />
      <div className="container" style={{ paddingBottom: "4rem" }}>
        {rows.length === 0 ? (
          <div className="panel">No public briefs at the moment.</div>
        ) : (
          <div className="grid-2">
            {rows.map((r) => (
              <article className="panel" key={r.id}>
                <h3>{r.title}</h3>
                <p>{r.brief}</p>
                {r.budget_kobo ? <p className="mono">{formatNgn(r.budget_kobo)}</p> : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
