import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { sql } from "@/db";

export const metadata = { title: "Programmes" };

export default async function ProgrammesPage() {
  let programmes: { title: string; synopsis: string; fee_kobo: number }[] = [];
  try {
    programmes = await sql`SELECT title, synopsis, fee_kobo FROM training_programmes WHERE is_public = true`;
  } catch {
    programmes = [];
  }
  return (
    <>
      <PageHero
        kicker="Programmes"
        title="Accelerator, studio, commons — finance last."
        lede="Support is gated and evidence-based. Prototype grants, maintenance sponsorships and studio work are distinct from member savings."
      />
      <div className="container" style={{ paddingBottom: "4rem" }}>
        <div className="grid-2" style={{ marginBottom: "1.2rem" }}>
          <figure className="panel" style={{ padding: 0, overflow: "hidden", margin: 0 }}>
            <Image src="/media/code-terminal.jpg" alt="Code runtime" width={800} height={450} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
          </figure>
          <figure className="panel" style={{ padding: 0, overflow: "hidden", margin: 0 }}>
            <Image src="/media/ai-lab.jpg" alt="AI evaluation lab" width={800} height={450} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
          </figure>
        </div>
        <div className="grid-2">
          <article className="panel">
            <h3>Developer project funding</h3>
            <p>Seven stages from submission to closeout. Staged disbursement, never lump-sum. Threshold 70/100 confers no automatic entitlement.</p>
          </article>
          <article className="panel">
            <h3>NDC Studio</h3>
            <p>Client-acquisition and delivery arm. Not advertised as guaranteed jobs. Members receive contracted compensation first; cooperative margin only when earned.</p>
          </article>
        </div>
        <div style={{ marginTop: "1.5rem" }} className="grid-3">
          {programmes.map((p) => (
            <article className="panel" key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.synopsis}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
