import { notFound } from "next/navigation";
import { sql } from "@/db";
import { PageHero } from "@/components/PageHero";

export default async function DeveloperPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql<{
    display_name: string;
    bio: string | null;
    headline: string | null;
    discipline: string | null;
    github_url: string | null;
    website_url: string | null;
  }[]>`
    SELECT p.display_name, p.bio, p.headline, d.discipline, d.github_url, d.website_url
    FROM profiles p
    JOIN memberships m ON m.user_id = p.user_id AND m.status = 'active'
    LEFT JOIN developer_profiles d ON d.user_id = p.user_id
    WHERE p.user_id = ${id}
  `;
  const p = rows[0];
  if (!p) notFound();
  return (
    <>
      <PageHero kicker="Member" title={p.display_name} lede={p.headline || p.discipline || "Verified professional member."} />
      <div className="narrow" style={{ paddingBottom: "4rem" }}>
        <div className="panel">
          <p>{p.bio || "This member has not published a public biography."}</p>
          {p.github_url ? <p><a href={p.github_url}>GitHub profile</a></p> : null}
          {p.website_url ? <p><a href={p.website_url}>Website</a></p> : null}
          <p className="muted">Private source code, identity documents and financial data are not shown here.</p>
        </div>
      </div>
    </>
  );
}
