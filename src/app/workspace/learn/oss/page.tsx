import { sql } from "@/db";

export const metadata = { title: "Open source" };

export default async function OssPage() {
  const rows = await sql<{ title: string; kind: string; description: string; repo_url: string | null }[]>`
    SELECT title, kind, description, repo_url FROM oss_opportunities WHERE is_public = true
  `;
  return (
    <>
      <p className="kicker">Commons</p>
      <h1>Open-source opportunities</h1>
      <p>Maintenance sponsorship, bug bounty and service agreements — funded from authorised programme pools, not member savings.</p>
      {rows.map((r, i) => (
        <article className="panel" key={i}>
          <span className="tag">{r.kind}</span>
          <h3>{r.title}</h3>
          <p>{r.description}</p>
          {r.repo_url ? <a href={r.repo_url}>{r.repo_url}</a> : null}
        </article>
      ))}
    </>
  );
}
