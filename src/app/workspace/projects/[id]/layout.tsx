import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { notFound } from "next/navigation";
import Link from "next/link";

const TABS = [
  ["Overview", ""],
  ["Canvas", "canvas"],
  ["Validation", "validation"],
  ["Budget", "budget"],
  ["Repo", "repo"],
  ["Team", "team"],
  ["Diligence", "diligence"],
  ["Scoring", "scoring"],
  ["Review", "review"],
  ["Agreement", "agreement"],
  ["Milestones", "milestones"],
  ["Invoices", "invoices"],
  ["Deliverables", "deliverables"],
  ["Monitoring", "monitoring"],
  ["Risk", "risk"],
  ["Closure", "closure"],
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const p = (await sql<{ title: string; stage: string }[]>`
    SELECT title, stage::text FROM project_submissions WHERE id = ${id}
  `)[0];
  if (!p) notFound();
  return (
    <>
      <p className="kicker">{p.stage}</p>
      <h1>{p.title}</h1>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.2rem" }}>
        {TABS.map(([label, slug]) => (
          <Link key={label} className="tag" href={`/workspace/projects/${id}${slug ? `/${slug}` : ""}`}>
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
