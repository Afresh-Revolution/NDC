import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./PublicChrome.module.scss";

const NAV = [
  ["Mission", "/mission"],
  ["Membership", "/membership"],
  ["Programmes", "/programmes"],
  ["Developers", "/developers"],
  ["Projects", "/projects"],
  ["Studio", "/studio"],
  ["Governance", "/governance"],
];

export function PublicHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.mark}>
        <BrandMark size="md" className={styles.logo} />
        <span>
          <strong>NDC Naija</strong>
          <em>Northside Developers Cooperative</em>
        </span>
      </Link>
      <nav className={styles.nav}>
        {NAV.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <ThemeToggle />
        <Link href="/login" className="btn ghost small">
          Member login
        </Link>
        <Link href="/register" className="btn small">
          Apply
        </Link>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div>
            <BrandMark size="lg" className={styles.footerLogo} />
            <p className="kicker">NDC / Naija</p>
            <p>Building together. Funding innovation. Owning the future.</p>
            <p className="muted">
              Proposed framework. Fees, reserves, legal classifications, lending and investment
              require member adoption and professional review.
            </p>
          </div>
          <div>
            <p className="kicker">Public</p>
            <Link href="/faq">FAQ</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/news">News</Link>
            <Link href="/chapters">Chapters</Link>
          </div>
          <div>
            <p className="kicker">Institution</p>
            <Link href="/team">Team</Link>
            <Link href="/cases">Cases</Link>
            <Link href="/opportunities">Opportunities</Link>
            <Link href="/governance">Governance</Link>
            <Link href="/admin">Super admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
