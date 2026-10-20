import { PageHero } from "@/components/PageHero";
import { sql } from "@/db";
import Link from "next/link";

export const metadata = { title: "News" };

export default async function NewsPage() {
  let posts: { slug: string; title: string; excerpt: string | null }[] = [];
  try {
    posts = await sql`SELECT slug, title, excerpt FROM news_posts WHERE published_at IS NOT NULL ORDER BY published_at DESC`;
  } catch {
    posts = [];
  }
  return (
    <>
      <PageHero kicker="News" title="Disclosures over theatre." lede="Quarterly performance, policy publication, and research notes. No performative trading dashboards." />
      <div className="narrow" style={{ paddingBottom: "4rem" }}>
        {posts.map((p) => (
          <article className="panel" key={p.slug} style={{ marginBottom: "1rem" }}>
            <h3><Link href={`/news/${p.slug}`}>{p.title}</Link></h3>
            <p>{p.excerpt}</p>
          </article>
        ))}
      </div>
    </>
  );
}
