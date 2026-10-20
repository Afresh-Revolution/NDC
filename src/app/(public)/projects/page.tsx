import { PageHero } from "@/components/PageHero";
import { sql } from "@/db";
import Link from "next/link";

export const metadata = { title: "Public project directory" };

export default async function PublicProjectsPage() {
  let projects: { id: string; slug: string | null; title: string; problem_statement: string; stage: string }[] = [];
  try {
    projects = await sql`
      SELECT id, slug, title, problem_statement, stage::text
      FROM project_submissions WHERE is_public = true
      ORDER BY created_at DESC LIMIT 40
    `;
  } catch {
    projects = [];
  }
  return (
    <>
      <PageHero
        kicker="Projects"
        title="Transparent selection, private source."
        lede="Public listings show problem, stage and outcomes — never proprietary code, customer data, or confidential diligence."
      />
      <div className="container" style={{ paddingBottom: "4rem" }}>
        {projects.length === 0 ? (
          <div className="panel">No public projects yet. Intake is open to verified members; disbursement remains gated.</div>
        ) : (
          <div className="grid-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.slug || p.id}`} className="panel" style={{ textDecoration: "none" }}>
                <span className="tag">{p.stage}</span>
                <h3>{p.title}</h3>
                <p>{p.problem_statement}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
