import { requestMyData } from "@/app/actions/account";
import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";

export const metadata = { title: "Data rights" };

export default async function DataRightsPage() {
  const user = await requireUser();
  const reqs = await sql<{ kind: string; status: string; created_at: string }[]>`
    SELECT kind, status, created_at::text FROM data_requests WHERE user_id = ${user.id} ORDER BY created_at DESC
  `;
  return (
    <>
      <p className="kicker">NDPA 2023</p>
      <h1>Access to your own data</h1>
      <p>You may download contribution history from Statement and request a packaged export of identity, membership and project records you own.</p>
      <form action={requestMyData} className="panel">
        <button className="btn" type="submit">Request data access pack</button>
      </form>
      <ul>
        {reqs.map((r, i) => <li key={i}>{r.kind} · {r.status} · {r.created_at.slice(0, 10)}</li>)}
      </ul>
    </>
  );
}
