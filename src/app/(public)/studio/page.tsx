import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import Link from "next/link";

export const metadata = { title: "NDC Studio" };

export default function StudioPage() {
  return (
    <>
      <PageHero
        kicker="07 / Studio contracts"
        title="Paid delivery, transparent margin, no guaranteed jobs."
        lede="Business development sources leads; an approved lead owner issues quotation and scope. Teams are matched on skill and availability — not favouritism."
      />
      <div className="container" style={{ paddingBottom: "4rem" }}>
        <figure className="panel" style={{ padding: 0, overflow: "hidden", marginBottom: "1.2rem" }}>
          <Image
            src="/media/builders.jpg"
            alt="NDC studio crew working together"
            width={1600}
            height={900}
            style={{ width: "100%", height: "280px", objectFit: "cover", display: "block" }}
          />
        </figure>
        <div className="grid-2">
          <article className="panel">
            <h3>How a contract moves</h3>
            <p>Buyer brief → NDA if required → feasibility / quote → approved scope and payment plan → talent match → signing → milestones → QA and acceptance → invoice → team settlement → feedback.</p>
          </article>
          <article className="panel">
            <h3>Revenue sources (conditional)</h3>
            <p>Studio margin, optional training, disclosed grant overhead, volume infrastructure benefits, and royalties only where NDC contractually owns or licenses rights.</p>
          </article>
        </div>
        <p style={{ marginTop: "1.5rem" }}>
          <Link href="/opportunities" className="btn">See open opportunities</Link>
        </p>
      </div>
    </>
  );
}
