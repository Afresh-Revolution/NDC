import { PageHero } from "@/components/PageHero";
import { sql } from "@/db";
import Link from "next/link";

export const metadata = { title: "Developer directory" };

export default async function DevelopersPage() {
  let people: { user_id: string; display_name: string; headline: string | null; discipline: string | null; state_code: string | null }[] = [];
  try {
    people = await sql`
      SELECT p.user_id, p.display_name, p.headline, d.discipline, p.state_code
      FROM profiles p
      JOIN memberships m ON m.user_id = p.user_id AND m.status = 'active'
      LEFT JOIN developer_profiles d ON d.user_id = p.user_id
      WHERE m.class = 'full_professional'
      ORDER BY p.display_name
      LIMIT 60
    `;
  } catch {
    people = [];
  }
  return (
    <>
      <PageHero
        kicker="Directory"
        title="Verified professionals, not a marketplace of promises."
        lede="Members may appear here after identity verification and committee approval. Private repositories and identity files are never published."
      />
      <div className="container" style={{ paddingBottom: "4rem" }}>
        {people.length === 0 ? (
          <div className="panel">No public professional profiles yet. Admission is gated.</div>
        ) : (
          <div className="grid-3">
            {people.map((p) => (
              <Link key={p.user_id} href={`/developers/${p.user_id}`} className="panel" style={{ textDecoration: "none" }}>
                <h3>{p.display_name}</h3>
                <p className="muted">{p.headline || p.discipline || "Member"}</p>
                {p.state_code ? <span className="tag">{p.state_code}</span> : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
