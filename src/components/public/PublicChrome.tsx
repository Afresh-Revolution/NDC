"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/" className={styles.mark}>
          <BrandMark size="md" className={styles.logo} />
          <span>
            <strong>NDC Naija</strong>
            <em>Northside Developers Cooperative</em>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Public">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <ThemeToggle />
          <Link href="/login" className={`btn ghost small ${styles.desk}`}>
            Member login
          </Link>
          <Link href="/register" className={`btn small ${styles.desk}`}>
            Apply
          </Link>
          <button
            type="button"
            className={styles.burger}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className={`${styles.sheet} ${open ? styles.sheetOn : ""}`}>
        <nav aria-label="Public">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.sheetActions}>
          <Link href="/login" className="btn ghost">
            Member login
          </Link>
          <Link href="/register" className="btn">
            Apply
          </Link>
        </div>
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
