import { PageHero } from "@/components/PageHero";
import { contactAction } from "@/app/actions/public";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHero kicker="Contact" title="Write to the secretariat." lede="Partnerships, membership questions and press. Do not send identity documents to this form." />
      <div className="narrow" style={{ paddingBottom: "4rem" }}>
        <form action={contactAction} className="panel">
          <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" required /></div>
          <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" name="email" required /></div>
          <div className="field"><label htmlFor="body">Message</label><textarea id="body" name="body" rows={6} required /></div>
          <button className="btn" type="submit">Send</button>
        </form>
      </div>
    </>
  );
}
