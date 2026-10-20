import Image from "next/image";
import Link from "next/link";
import { CodePane } from "@/components/CodePane";
import styles from "./home.module.scss";

const FUNCTIONS = [
  ["01", "Member cooperative", "Verified identity, share structure, contributions, voting and governance."],
  ["02", "Project accelerator", "Concept screening, validation, milestones, mentorship and go-to-market support."],
  ["03", "Shared development studio", "Paid software contracts, delivery teams and portfolio credibility."],
  ["04", "Technical commons", "Shared tooling, mentoring, code review, training and negotiated infrastructure."],
  ["05", "Optional regulated finance", "Member credit and investment only after applicable approvals."],
];

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <p className="kicker">Proposed framework · October 2026 · v1.0</p>
          <h1>
            A developer-led cooperative
            <span> for Northern Nigeria.</span>
          </h1>
          <p className="lede">
            Northside Developers Cooperative combines savings, vetted collaboration, venture
            preparation, shared infrastructure and tightly controlled project support. Membership
            does not automatically guarantee financing, employment, loans, or returns.
          </p>
          <div className={styles.cta}>
            <Link href="/register" className="btn">
              Apply for membership
            </Link>
            <Link href="/governance" className="btn ghost">
              Read governance
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.media}>
        <div className="container">
          <p className="kicker">Signal / runtime</p>
          <h2>Code. Models. Delivery crews.</h2>
          <div className={styles.shots}>
            <figure>
              <Image
                src="/media/code-terminal.jpg"
                alt="Teal-lit workstation showing source code in a terminal"
                width={960}
                height={540}
              />
              <figcaption>src / runtime</figcaption>
            </figure>
            <figure>
              <Image
                src="/media/ai-lab.jpg"
                alt="AI lab monitors with neural graphs and notebooks"
                width={960}
                height={540}
              />
              <figcaption>models / eval</figcaption>
            </figure>
            <figure>
              <Image
                src="/media/builders.jpg"
                alt="Developers collaborating over laptops in a studio"
                width={960}
                height={540}
              />
              <figcaption>studio / crew</figcaption>
            </figure>
          </div>
          <div className={styles.terminal}>
            <CodePane />
            <p className="muted">
              Savings post to liability 2100. Project risk never shares that account. The interface is
              built like the ledger: typed, gated, inspectable.
            </p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className={styles.strip}>
          {FUNCTIONS.map(([n, title, body]) => (
            <article key={n}>
              <span className="mono">{n}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`container ${styles.block}`}>
        <div className="split">
          <div>
            <p className="kicker">Strategic distinction</p>
            <h2>Not a conventional savings society.</h2>
            <p>
              NDC is a practical technology production and commercialisation ecosystem. Funds owed
              back to members are recorded as liabilities. Project risk spend cannot be taken from
              unrelated members’ withdrawable contributions.
            </p>
            <p>
              Launch sequence: validate member needs → register and adopt bylaws → public platform
              and member workspace → savings ledger and controls → studio income → modest ring-fenced
              grants → authorised finance only after governance readiness.
            </p>
          </div>
          <aside className="panel">
            <p className="kicker">Illustrative, not a forecast</p>
            <p className={styles.stat}>₦1,000,000</p>
            <p>
              At 100 active members contributing ₦10,000 per month, the system records one million
              naira in <strong>member obligations</strong> — not free operating capital.
            </p>
            <Link href="/membership">See capital separation →</Link>
          </aside>
        </div>
      </section>
    </>
  );
}
