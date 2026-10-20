import { joinCommunity } from "@/app/actions/community";
import { sql } from "@/db";

export const metadata = { title: "Communities" };

export default async function CommunitiesPage() {
  const rows = await sql<{ id: string; name: string; description: string | null }[]>`SELECT id, name, description FROM communities`;
  return (
    <>
      <p className="kicker">Commons</p>
      <h1>Communities of practice</h1>
      {rows.map((c) => (
        <form action={joinCommunity} key={c.id} className="panel" style={{ marginBottom: "0.8rem" }}>
          <input type="hidden" name="communityId" value={c.id} />
          <h3>{c.name}</h3>
          <p>{c.description}</p>
          <button className="btn small" type="submit">Join</button>
        </form>
      ))}
    </>
  );
}
