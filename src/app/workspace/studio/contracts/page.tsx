import { sql } from "@/db";
import { requireUser } from "@/app/actions/auth";

export const metadata = { title: "Contracts" };

export default async function ContractsPage() {
  await requireUser();
  const rows = await sql<{ id: string; status: string; signed_at: string | null }[]>`
    SELECT id, status, signed_at::text FROM studio_contracts ORDER BY id DESC LIMIT 20
  `;
  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Signed statements of work</h1>
      <p>Contracts define payment milestones, acceptance, defect warranty, IP transfer, open-source components and termination.</p>
      <div className="panel">{rows.length === 0 ? "No contracts." : rows.map((r) => <p key={r.id}>{r.status} · {r.signed_at ?? "unsigned"}</p>)}</div>
    </>
  );
}
