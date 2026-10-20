import { sql } from "@/db";

export const metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const rows = await sql<{ title: string; kind: string; body: string | null; url: string | null }[]>`SELECT title, kind, body, url FROM resources`;
  return (
    <>
      <p className="kicker">Commons</p>
      <h1>Resources</h1>
      {rows.length === 0 ? (
        <div className="panel">Operating manuals will appear here after board publication: savings policy, project selection, studio MSA, incident plan.</div>
      ) : rows.map((r, i) => (
        <article className="panel" key={i}><h3>{r.title}</h3><p>{r.body}</p></article>
      ))}
    </>
  );
}
