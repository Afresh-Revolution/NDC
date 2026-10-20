import { acceptDeclarations } from "@/app/actions/onboarding";
import { sql } from "@/db";

export const metadata = { title: "Declarations" };

export default async function DeclarationsPage() {
  const policies = await sql<{ slug: string; title: string; body: string }[]>`
    SELECT DISTINCT ON (slug) slug, title, body
    FROM policy_versions WHERE published = true
    ORDER BY slug, effective_at DESC
  `;
  return (
    <div className="narrow">
      <p className="kicker">Onboarding · declarations</p>
      <h1>Accept policies explicitly</h1>
      <form action={acceptDeclarations} className="panel">
        {policies.map((p) => (
          <article key={p.slug} style={{ marginBottom: "1.2rem" }}>
            <h3>{p.title}</h3>
            <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{p.body}</p>
            <label>
              <input type="checkbox" name={p.slug} required /> I have read and accept this instrument
            </label>
          </article>
        ))}
        <button className="btn" type="submit">Record consents</button>
      </form>
    </div>
  );
}
