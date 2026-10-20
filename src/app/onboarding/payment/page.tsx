import { submitApplication } from "@/app/actions/onboarding";
import Link from "next/link";

export const metadata = { title: "Membership payment" };

export default function PaymentOnboardingPage() {
  return (
    <div className="narrow">
      <p className="kicker">Onboarding · payment</p>
      <h1>Dues are not assumed</h1>
      <div className="panel">
        <p>Professional and associate dues are billed on the membership page. Paystack settles them immediately. A bank transfer starts the cycle only after an admin approves the reference.</p>
        <p style={{ marginBottom: "0.8rem" }}>
          <Link className="btn" href="/workspace/membership">Continue to membership</Link>
        </p>
        <form action={submitApplication}>
          <button className="btn ghost" type="submit">Submit for committee review without payment (dev)</button>
        </form>
      </div>
    </div>
  );
}
