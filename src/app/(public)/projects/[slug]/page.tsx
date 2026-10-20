import { notFound } from "next/navigation";
import { sql } from "@/db";
import { PageHero } from "@/components/PageHero";

export default async function PublicProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rows = await sql<{
    title: string;
    problem_statement: string;
    target_users: string;
    stage: string;
    project_type: string;
  }[]>`
    SELECT title, problem_statement, target_users, stage::text, project_type::text
    FROM project_submissions
    WHERE (slug = ${slug} OR id::text = ${slug}) AND is_public = true
    LIMIT 1
  `;
  const p = rows[0];
  if (!p) notFound();
  return (
    <>
      <PageHero kicker={p.project_type} title={p.title} lede={p.problem_statement} />
      <div className="narrow" style={{ paddingBottom: "4rem" }}>
        <div className="panel">
          <p><strong>Target users.</strong> {p.target_users}</p>
          <p><span className="tag">{p.stage}</span></p>
          <p className="muted">Proprietary code and private customer data are not made public. Scores do not entitle a team to money.</p>
        </div>
      </div>
    </>
  );
}
