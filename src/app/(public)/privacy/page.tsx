import { PageHero } from "@/components/PageHero";
import { sql } from "@/db";

export const metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  let body = "NDC processes identity, membership, financial and project data under the Nigeria Data Protection Act 2023. Members may request access to their own data from the workspace.";
  try {
    const rows = await sql<{ body: string }[]>`
      SELECT body FROM policy_versions WHERE slug = 'privacy' AND published = true ORDER BY effective_at DESC LIMIT 1
    `;
    if (rows[0]) body = rows[0].body;
  } catch {
    /* keep fallback */
  }
  return (
    <>
      <PageHero kicker="NDPA 2023" title="Privacy notice" lede="Lawful processing, retention schedules and subject-right workflows are part of the platform, not a footnote." />
      <div className="narrow" style={{ paddingBottom: "4rem" }}>
        <div className="panel" style={{ whiteSpace: "pre-wrap" }}>{body}</div>
      </div>
    </>
  );
}
