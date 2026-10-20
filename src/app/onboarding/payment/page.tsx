import { startMembershipPayment, submitApplication } from "@/app/actions/onboarding";

export const metadata = { title: "Membership payment" };

export default function PaymentOnboardingPage() {
  return (
    <div className="narrow">
      <p className="kicker">Onboarding · payment</p>
      <h1>Dues are not assumed</h1>
      <div className="panel">
        <p>Registration fees, monthly savings, share capital, optional project levies and annual renewal must be priced after affordability survey and member approval. This sandbox records a placeholder invoice so the ledger path can be tested without publishing a fee schedule.</p>
        <p className="muted">Connect Paystack or Flutterwave in environment variables to charge NGN. Webhooks post to the double-entry ledger with idempotency keys.</p>
        <form action={startMembershipPayment} style={{ marginBottom: "0.8rem" }}>
          <button className="btn" type="submit">Issue placeholder invoice</button>
        </form>
        <form action={submitApplication}>
          <button className="btn ghost" type="submit">Submit for committee review without payment (dev)</button>
        </form>
      </div>
    </div>
  );
}
