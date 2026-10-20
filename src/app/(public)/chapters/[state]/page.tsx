import { notFound } from "next/navigation";
import { sql } from "@/db";
import { PageHero } from "@/components/PageHero";

export default async function ChapterPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const rows = await sql<{ name: string; description: string | null; state_code: string }[]>`
    SELECT name, description, state_code FROM chapters WHERE lower(state_code) = ${state.toLowerCase()} LIMIT 1
  `;
  const c = rows[0];
  if (!c) notFound();
  return (
    <>
      <PageHero kicker={`Chapter ${c.state_code}`} title={c.name} lede={c.description || "Local NDC chapter."} />
      <div className="narrow" style={{ paddingBottom: "4rem" }}>
        <div className="panel">
          <p>Chapter coordinators may run programmes, mentoring and support tickets. They cannot move member savings, approve grants, or override dual-control payouts.</p>
        </div>
      </div>
    </>
  );
}
