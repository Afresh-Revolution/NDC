import {
  reviewManualMembershipPayment,
  saveMembershipAdminSettings,
  suspendMembershipAction,
} from "@/app/actions/membership";
import { requireUser } from "@/app/actions/auth";
import { can } from "@/lib/auth";
import { getMembershipSettings, listManualQueue, listMembershipBalances } from "@/lib/membership";
import { PendingButton } from "@/components/PendingButton";
import { formatNgn, koboToNaira } from "@/lib/money";
import { redirect } from "next/navigation";

export const metadata = { title: "Membership admin" };

export default async function AdminMembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const user = await requireUser();
  if (!can(user, "members.read") && !user.roles.includes("super_admin") && !user.roles.includes("admin")) {
    redirect("/workspace");
  }
  const query = await searchParams;
  const settings = await getMembershipSettings();
  const queue = await listManualQueue();
  const members = await listMembershipBalances();
  const naira = (kobo: number) => String(koboToNaira(kobo));

  return (
    <>
      <p className="kicker">Finance</p>
      <h1>Membership</h1>
      <p className="muted">Call GET or POST /api/cron/billing with the cron secret each day. That job creates the next invoice only for memberships that are still running. Cancellation stops new invoices.</p>
      {query.error ? <p className="flash error">{query.error}</p> : null}
      {query.notice === "saved" ? <p className="flash">Membership settings saved.</p> : null}

      <form className="panel" action={saveMembershipAdminSettings}>
        <p className="kicker">Manual account</p>
        <p className="muted">Members see this when they choose manual pay. New submissions email the address below.</p>
        <label className="field">Bank
          <input name="bankName" defaultValue={settings.bank_name} />
        </label>
        <label className="field">Account name
          <input name="accountName" defaultValue={settings.account_name} />
        </label>
        <label className="field">Account number
          <input name="accountNumber" defaultValue={settings.account_number} inputMode="numeric" />
        </label>
        <label className="field">Approval email
          <input name="notifyEmail" type="email" defaultValue={settings.notify_email} />
        </label>
        <p className="kicker">Prices in naira</p>
        <div className="grid-2">
          <label className="field">Professional monthly
            <input name="professionalMonthly" defaultValue={naira(settings.professional_monthly_kobo)} />
          </label>
          <label className="field">Professional yearly
            <input name="professionalYearly" defaultValue={naira(settings.professional_yearly_kobo)} />
          </label>
          <label className="field">Associate monthly
            <input name="associateMonthly" defaultValue={naira(settings.associate_monthly_kobo)} />
          </label>
          <label className="field">Associate yearly
            <input name="associateYearly" defaultValue={naira(settings.associate_yearly_kobo)} />
          </label>
          <label className="field">Professional registration
            <input name="registration" defaultValue={naira(settings.registration_kobo)} />
          </label>
          <label className="field">Grace days
            <input name="graceDays" type="number" min={0} defaultValue={settings.grace_days} />
          </label>
        </div>
        <button className="btn" type="submit">Save</button>
      </form>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <p className="kicker">Waiting for approval</p>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Member</th><th>Reference</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {queue.map((row) => (
                <tr key={row.id}>
                  <td>{row.display_name || row.email}</td>
                  <td className="mono">{row.transfer_reference}</td>
                  <td>{formatNgn(row.amount_kobo)}</td>
                  <td>{row.status}</td>
                  <td>
                    {row.status === "pending" || row.status === "rejected" ? (
                      <div className="row-actions">
                        <form action={reviewManualMembershipPayment}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="decision" value="approve" />
                          <PendingButton pendingLabel="Approving…">Approve</PendingButton>
                        </form>
                        {row.status === "pending" ? (
                          <form action={reviewManualMembershipPayment}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="decision" value="reject" />
                            <PendingButton variant="ghost" pendingLabel="Rejecting…">Reject</PendingButton>
                          </form>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {queue.length === 0 ? <tr><td colSpan={5}>No manual payments.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <p className="kicker">Balances</p>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Member</th><th>Plan</th><th>Status</th><th>Outstanding</th><th></th></tr></thead>
            <tbody>
              {members.map((row) => (
                <tr key={row.user_id}>
                  <td>{row.display_name || row.email}</td>
                  <td>{row.class ?? "—"}</td>
                  <td>{row.status}</td>
                  <td>{formatNgn(row.outstanding)}</td>
                  <td>
                    <form action={suspendMembershipAction}>
                      <input type="hidden" name="userId" value={row.user_id} />
                      <input type="hidden" name="decision" value={row.status === "paused" ? "restore" : "suspend"} />
                      <PendingButton variant="ghost" pendingLabel={row.status === "paused" ? "Restoring…" : "Suspending…"}>
                        {row.status === "paused" ? "Restore" : "Suspend"}
                      </PendingButton>
                    </form>
                  </td>
                </tr>
              ))}
              {members.length === 0 ? <tr><td colSpan={5}>No subscriptions yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
