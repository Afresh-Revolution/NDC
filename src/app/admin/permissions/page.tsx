import { assignRole } from "@/app/actions/admin";
import { sql } from "@/db";

export const metadata = { title: "Permissions" };

export default async function PermissionsPage() {
  const roles = await sql<{ slug: string; name: string }[]>`SELECT slug, name FROM roles ORDER BY name`;
  const matrix = await sql<{ role: string; perm: string }[]>`
    SELECT r.slug AS role, p.slug AS perm
    FROM role_permissions rp JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id
    ORDER BY r.slug, p.slug
  `;
  return (
    <>
      <p className="kicker">RBAC</p>
      <h1>Roles and permissions</h1>
      <p>Initiation, approval, disbursement, bookkeeping and reconciliation are separate roles. Super admin still needs a second approver for payouts.</p>
      <form action={assignRole} className="panel">
        <div className="field"><label>User email</label><input name="email" type="email" required /></div>
        <div className="field"><label>Role</label>
          <select name="role">{roles.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}</select>
        </div>
        <button className="btn" type="submit">Grant role</button>
      </form>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data">
          <thead><tr><th>Role</th><th>Permission</th></tr></thead>
          <tbody>{matrix.map((m, i) => <tr key={i}><td>{m.role}</td><td className="mono">{m.perm}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
