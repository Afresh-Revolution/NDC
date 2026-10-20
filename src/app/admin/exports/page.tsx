import { requireUser } from "@/app/actions/auth";
import { can } from "@/lib/auth";

export const metadata = { title: "Exports" };

export default async function ExportsPage() {
  const user = await requireUser();
  return (
    <>
      <p className="kicker">Audit exports</p>
      <h1>Download ledgers</h1>
      <p>Financial balances are read from posted journals. Exports are permissioned.</p>
      {can(user, "finance.export") ? (
        <p><a className="btn" href="/api/export/ledger">Download ledger CSV</a></p>
      ) : (
        <p>You need finance.export permission.</p>
      )}
    </>
  );
}
