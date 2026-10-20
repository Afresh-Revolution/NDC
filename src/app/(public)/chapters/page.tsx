import { PageHero } from "@/components/PageHero";
import { sql } from "@/db";
import Link from "next/link";

export const metadata = { title: "Chapters" };

export default async function ChaptersPage() {
  let chapters: { state_code: string; name: string; description: string | null }[] = [];
  try {
    chapters = await sql`SELECT state_code, name, description FROM chapters ORDER BY name`;
  } catch {
    chapters = [];
  }
  return (
    <>
      <PageHero
        kicker="Chapters"
        title="Local programmes. No unrestricted finance powers."
        lede="State coordinators organise community support. Disbursement, treasury and admissions remain national, dual-controlled functions."
      />
      <div className="container" style={{ paddingBottom: "4rem" }}>
        <div className="grid-3">
          {chapters.map((c) => (
            <Link key={c.state_code} href={`/chapters/${c.state_code.toLowerCase()}`} className="panel" style={{ textDecoration: "none" }}>
              <span className="tag">{c.state_code}</span>
              <h3>{c.name}</h3>
              <p className="muted">{c.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
