import { sql } from "@/db";
import { formatNgn } from "@/lib/money";

export default async function ProjectInvoicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql<{ unique_reference: string; amount_kobo: number; status: string }[]>`
    SELECT unique_reference, amount_kobo, status FROM disbursements WHERE project_id = ${id}
  `;
  return (
    <div className="table-wrap">
      <table className="data">
        <thead><tr><th>Reference</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={3}>No disbursement invoices. Project spend cannot post to savings liabilities.</td></tr> : rows.map((r) => (
            <tr key={r.unique_reference}><td className="mono">{r.unique_reference}</td><td>{formatNgn(r.amount_kobo)}</td><td>{r.status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
