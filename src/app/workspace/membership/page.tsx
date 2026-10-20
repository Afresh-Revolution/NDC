import {
  cancelMembershipAction,
  changeMembershipFrequency,
  chooseMembershipPlan,
  payMembershipWithPaystack,
  submitManualMembershipPayment,
} from "@/app/actions/membership";
import { requireUser } from "@/app/actions/auth";
import { env } from "@/lib/env";
import { confirmPaystackReference, membershipSnapshot, runMembershipBilling } from "@/lib/membership";
import { CopyAccount } from "@/components/CopyAccount";
import { formatNgn } from "@/lib/money";

export const metadata = { title: "Membership" };

const PRIVILEGES = [
  ["Professional", "Voting, office, project funding and borrowing eligibility once those programmes are open. Studio work stays a separate contract."],
  ["Associate", "Community, mentorship and learning. No voting, borrowing, or project funding."],
];

export default async function MembershipWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; reference?: string; trxref?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const reference = query.reference || query.trxref || "";
  let payError = "";
  if (reference.startsWith("NDC-SUB-")) {
    try {
      await confirmPaystackReference(reference);
    } catch (error) {
      payError = error instanceof Error ? error.message : "Payment could not be confirmed.";
    }
  }
  await runMembershipBilling();
  const snap = await membershipSnapshot(user.id);
  const running = Boolean(snap.sub?.started_at) && !snap.sub?.cancelled_at;
  const started = Boolean(snap.sub?.started_at);
  const amount = snap.sub ? formatNgn(
    snap.sub.frequency === "yearly"
      ? snap.sub.class === "professional"
        ? snap.settings.professional_yearly_kobo
        : snap.settings.associate_yearly_kobo
      : snap.sub.class === "professional"
        ? snap.settings.professional_monthly_kobo
        : snap.settings.associate_monthly_kobo,
  ) : "";

  return (
    <>
      <p className="kicker">Membership</p>
      <h1>{snap.label}</h1>
      {query.error || payError ? <p className="flash error">{query.error || payError}</p> : null}
      {query.notice === "submitted" ? <p className="flash">Transfer submitted. Membership starts after approval.</p> : null}

      <div className="grid-2">
        <article className="panel">
          <p className="kicker">This cycle</p>
          {snap.sub ? (
            <>
              <p>
                {snap.sub.class === "professional" ? "Professional" : "Associate"} · {snap.sub.frequency}
                {running ? ` · ${amount}` : ""}
              </p>
              <p>Outstanding {formatNgn(snap.outstandingKobo)}. This is not savings and it is not deducted from savings.</p>
              {snap.sub.started_at ? <p className="muted">Started {snap.sub.started_at}. Current period {snap.sub.period_start} to {snap.sub.period_end}.</p> : <p className="muted">The billing cycle starts after the first payment is confirmed.</p>}
              {snap.sub.next_due && running ? <p className="muted">Next due {snap.sub.next_due}.</p> : null}
              {snap.sub.pending_frequency ? <p className="muted">Next cycle switches to {snap.sub.pending_frequency}.</p> : null}
              {snap.sub.cancelled_at ? <p>Cancelled {snap.sub.cancelled_at}. No further invoices are created. Amounts already billed stay payable.</p> : null}
            </>
          ) : (
            <p>Choose a plan. Professional registration is {formatNgn(snap.settings.registration_kobo)} once, then the subscription. Associate members do not pay registration.</p>
          )}
        </article>
        <article className="panel">
          <p className="kicker">What the plan allows</p>
          {PRIVILEGES.map(([title, body]) => (
            <p key={title}><strong>{title}.</strong> {body}</p>
          ))}
        </article>
      </div>

      {!started ? (
        <form className="panel" action={chooseMembershipPlan} style={{ marginTop: "1rem" }}>
          <p className="kicker">Plan</p>
          <label className="field">Class
            <select name="plan" defaultValue={snap.sub?.class ?? "professional"}>
              <option value="professional">Professional — {formatNgn(snap.settings.professional_monthly_kobo)} / month or {formatNgn(snap.settings.professional_yearly_kobo)} / year</option>
              <option value="associate">Associate — {formatNgn(snap.settings.associate_monthly_kobo)} / month or {formatNgn(snap.settings.associate_yearly_kobo)} / year</option>
            </select>
          </label>
          <label className="field">Frequency
            <select name="frequency" defaultValue={snap.sub?.frequency ?? "monthly"}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <button className="btn" type="submit">{snap.sub ? "Update unpaid plan" : "Create invoice"}</button>
        </form>
      ) : null}

      {snap.open.length > 0 ? (
        <section className="panel" style={{ marginTop: "1rem" }}>
          <p className="kicker">Pay {formatNgn(snap.outstandingKobo)}</p>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Item</th><th>Due</th><th>Amount</th></tr></thead>
              <tbody>
                {snap.open.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.description}</td>
                    <td>{invoice.due_at?.slice(0, 10) ?? invoice.period?.slice(0, 10)}</td>
                    <td>{formatNgn(invoice.amount_kobo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {env.paystackSecret ? (
            <form action={payMembershipWithPaystack} style={{ marginTop: "0.8rem" }}>
              <button className="btn" type="submit">Pay with Paystack</button>
            </form>
          ) : (
            <p className="flash warn" role="status">
              <span className="kicker">Paystack</span>
              Paystack is not configured on this server.
            </p>
          )}
          {snap.settings.account_number ? (
            <form className="pay-card" action={submitManualMembershipPayment}>
              <p className="kicker">Manual transfer</p>
              <dl className="pay-details">
                <div>
                  <dt>Bank</dt>
                  <dd>{snap.settings.bank_name || "—"}</dd>
                </div>
                <div>
                  <dt>Account name</dt>
                  <dd>{snap.settings.account_name || "—"}</dd>
                </div>
                <div className="pay-span">
                  <dt>Account number</dt>
                  <dd>
                    <CopyAccount value={snap.settings.account_number} />
                  </dd>
                </div>
                <div className="pay-span">
                  <dt>Amount to send</dt>
                  <dd>{formatNgn(snap.outstandingKobo)}</dd>
                </div>
              </dl>
              <p className="flash" role="note">
                <span className="kicker">After you pay</span>
                Submit the reference from your bank. Membership starts when an admin approves it.
              </p>
              <label className="field">Transfer reference
                <input name="reference" required minLength={4} placeholder="Bank reference" />
              </label>
              <button className="btn" type="submit">Submit for approval</button>
            </form>
          ) : (
            <p className="flash warn" role="status">
              <span className="kicker">Manual transfer</span>
              Manual transfer is unavailable until an account number is set.
            </p>
          )}
        </section>
      ) : null}

      {running ? (
        <div className="grid-2" style={{ marginTop: "1rem" }}>
          <form className="panel" action={changeMembershipFrequency}>
            <p className="kicker">Next cycle</p>
            <label className="field">Frequency
              <select name="frequency" defaultValue={snap.sub?.pending_frequency ?? snap.sub?.frequency}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
            <button className="btn ghost" type="submit">Apply from the next due date</button>
          </form>
          <form className="panel" action={cancelMembershipAction}>
            <p className="kicker">Cancel</p>
            <p>Cancellation stops new invoices. It does not erase what is already due, and it does not touch savings.</p>
            <button className="btn ghost" type="submit">Cancel membership</button>
          </form>
        </div>
      ) : null}

      <section className="panel" style={{ marginTop: "1rem" }}>
        <p className="kicker">History</p>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Reference</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {snap.history.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="mono">{invoice.reference}</td>
                  <td>{invoice.description}</td>
                  <td>{formatNgn(invoice.amount_kobo)}</td>
                  <td>{invoice.status}</td>
                </tr>
              ))}
              {snap.history.length === 0 ? <tr><td colSpan={4}>No membership invoices yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
