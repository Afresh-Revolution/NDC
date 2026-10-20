import { notFound } from "next/navigation";
import { sql } from "@/db";
import { PageHero } from "@/components/PageHero";

export default async function NewsArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rows = await sql<{ title: string; excerpt: string | null; body: string }[]>`
    SELECT title, excerpt, body FROM news_posts WHERE slug = ${slug} LIMIT 1
  `;
  const p = rows[0];
  if (!p) notFound();
  return (
    <>
      <PageHero kicker="News" title={p.title} lede={p.excerpt || ""} />
      <div className="narrow" style={{ paddingBottom: "4rem" }}>
        <div className="panel" style={{ whiteSpace: "pre-wrap" }}>{p.body}</div>
      </div>
    </>
  );
}
