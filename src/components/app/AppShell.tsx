"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { AuthUser } from "@/lib/auth";
import styles from "./AppShell.module.scss";

type NavItem = { href: string; label: string; group?: string };

export function AppShell({
  user,
  title,
  nav,
  children,
  home = "/workspace",
}: {
  user: AuthUser;
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
  home?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups = useMemo(
    () =>
      nav.reduce<Record<string, NavItem[]>>((acc, item) => {
        const g = item.group ?? "Menu";
        acc[g] ??= [];
        acc[g].push(item);
        return acc;
      }, {}),
    [nav],
  );

  const activeHref = useMemo(() => {
    const matches = nav
      .map((item) => item.href)
      .filter((href) => pathname === href || (href !== home && pathname.startsWith(`${href}/`)));
    return matches.sort((a, b) => b.length - a.length)[0] ?? "";
  }, [nav, pathname, home]);

  const current = nav.find((item) => item.href === activeHref);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const initials = user.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const navBody = (
    <>
      <Link href={home} className={styles.brand}>
        <BrandMark size="sm" className={styles.logo} />
        <span>
          <strong>NDC Naija</strong>
          <em>{title}</em>
        </span>
      </Link>
      <nav className={styles.menu} aria-label={title}>
        {Object.entries(groups).map(([group, items]) => (
          <section key={group} className={styles.section}>
            <p className={styles.group}>{group}</p>
            {items.map((item) => {
              const on = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.link} ${on ? styles.on : ""}`}
                  aria-current={on ? "page" : undefined}
                >
                  <NavIcon href={item.href} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </section>
        ))}
      </nav>
      <div className={styles.quick}>
        <Link href="/" className={styles.link}>
          <span>Public site</span>
        </Link>
        {user.roles.includes("super_admin") || user.roles.includes("admin") ? (
          <Link href={home.startsWith("/admin") ? "/workspace" : "/admin"} className={styles.link}>
            <span>{home.startsWith("/admin") ? "Workspace" : "Admin"}</span>
          </Link>
        ) : null}
      </div>
      <div className={styles.who}>
        <span className={styles.avatar} aria-hidden>
          {initials || "ND"}
        </span>
        <span>
          <b>{user.displayName}</b>
          <small>{user.roles[0]?.replaceAll("_", " ") || "member"}</small>
        </span>
      </div>
    </>
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.side}>{navBody}</aside>
      {open ? (
        <button
          type="button"
          className={styles.dim}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside className={`${styles.drawer} ${open ? styles.drawerOn : ""}`} aria-hidden={!open}>
        {navBody}
      </aside>
      <div className={styles.main}>
        <header className={styles.top}>
          <div className={styles.topLead}>
            <button
              type="button"
              className={styles.burger}
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <div>
              <p className={`kicker ${styles.eyebrow}`}>{user.displayName}</p>
              <p className={styles.meta}>
                {user.roles.map((role) => role.replaceAll("_", " ")).join(" · ") || "member"}
                {user.membershipStatus ? ` · ${user.membershipStatus}` : ""}
                {current ? ` · ${current.label}` : ""}
              </p>
            </div>
          </div>
          <div className={styles.tools}>
            <ThemeToggle />
            {user.roles.includes("super_admin") || user.roles.includes("admin") ? (
              <Link href={home.startsWith("/admin") ? "/workspace" : "/admin"} className={`btn ghost small ${styles.desk}`}>
                {home.startsWith("/admin") ? "Workspace" : "Admin"}
              </Link>
            ) : null}
            <Link href="/" className={`btn ghost small ${styles.desk}`}>
              Public site
            </Link>
            <form action={logoutAction}>
              <button className="btn small" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const ICON: Record<string, string> = {
  "/workspace": "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z",
  "/workspace/card": "M3 7h18v10H3V7zm0 3h18M7 15h4",
  "/workspace/profile": "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0",
  "/workspace/skills": "M8 8l-5 5 5 5M16 8l5 5-5 5",
  "/workspace/billing": "M3 8h18v10H3V8zm2 4h4",
  "/workspace/contributions": "M12 3v18M7 8h10M7 12h10M9 16h6",
  "/workspace/statement": "M7 4h10v16H7V4zm3 4h4M10 12h4M10 16h3",
  "/workspace/withdrawals": "M12 4v10m0 0l-4-4m4 4 4-4M5 18h14",
  "/workspace/shares": "M12 3l9 6-9 6-9-6 9-6zm-9 10l9 6 9-6",
  "/workspace/renewals": "M20 12a8 8 0 1 1-2.2-5.5M20 5v5h-5",
  "/workspace/notices": "M6 17h12l-1-3V10a5 5 0 0 0-10 0v4l-1 3zm4 0v1a2 2 0 0 0 4 0v-1",
  "/workspace/sessions": "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9zm6 4v2",
  "/workspace/settings": "M12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zM12 3v2.2M12 18.8V21M4.5 6.5l1.6 1.6M17.9 15.9l1.6 1.6M3 12h2.2M18.8 12H21M4.5 17.5l1.6-1.6M17.9 8.1l1.6-1.6",
  "/workspace/data-rights": "M12 3l8 4v6c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V7l8-4z",
  "/workspace/projects": "M3 7h8l2 2h8v10H3V7z",
  "/workspace/projects/new": "M12 5v14M5 12h14",
  "/workspace/studio": "M6 7h12l2 4H4l2-4zm-2 4h16v9H4v-9z",
  "/workspace/studio/apply": "M4 12l16-8-4 16-5-5-7-3z",
  "/workspace/studio/timesheets": "M12 8v5l3 2M12 21a9 9 0 1 1 9-9 9 9 0 0 1-9 9z",
  "/workspace/studio/payouts": "M4 10h16v8H4v-8zm2-4h12v4H6V6zm6 8h.01",
  "/workspace/studio/disputes": "M12 3l8 16H4L12 3zm0 6v4m0 3h.01",
  "/workspace/learn/mentorship": "M9 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9 11zm9 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM2 20a7 7 0 0 1 14 0M15 17a6 6 0 0 1 7 3",
  "/workspace/learn/programmes": "M5 4h14v16H5V4zm3 4h8M8 12h8M8 16h5",
  "/workspace/learn/events": "M7 4v3M17 4v3M4 9h16M5 7h14v13H5V7z",
  "/workspace/learn/oss": "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.5 6.1-6.6A5.1 5.1 0 0 0 19 4.8 4.8 4.8 0 0 0 19 1s-1-.3-3.1 1.2A10.7 10.7 0 0 0 8 2.2C5.9.7 4.9 1 4.9 1a4.8 4.8 0 0 0 .1 3.8A5.1 5.1 0 0 0 3.5 9c0 5.1 3.1 6.3 6.1 6.6a3.4 3.4 0 0 0-.9 2.5V22",
  "/workspace/learn/communities": "M12 21a9 9 0 1 1 9-9 9 9 0 0 1-9 9zm-7.5-9h15M12 3c3 3.5 3 14.5 0 18m0-18c-3 3.5-3 14.5 0 18",
  "/workspace/learn/resources": "M6 4h12v16l-6-3-6 3V4z",
  "/workspace/learn/feedback": "M5 5h14v10H8l-3 4V5z",
  "/admin": "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z",
  "/admin/verification": "M5 12l5 5L20 7",
  "/admin/members": "M9 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9 11zm9 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM2 20a7 7 0 0 1 14 0M15 17a6 6 0 0 1 7 3",
  "/admin/committees": "M4 6h16M4 12h16M4 18h10",
  "/admin/permissions": "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9z",
  "/admin/invoices": "M7 3h8l4 4v14H7V3zm4 9h6M11 13h4",
  "/admin/reconciliation": "M7 7H3v4M21 17h-4v4M4 11a8 8 0 0 1 14-2M20 13a8 8 0 0 1-14 2",
  "/admin/savings": "M4 10h16v8H4v-8zm8-6a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z",
  "/admin/treasury": "M3 19h18M5 19V9l7-5 7 5v10M9 19v-6h6v6",
  "/admin/exports": "M12 4v10m0 0 4-4m-4 4-4-4M5 18h14",
  "/admin/projects": "M3 7h8l2 2h8v10H3V7z",
  "/admin/sanctions": "M6 6l12 12M18 6L6 18",
  "/admin/disclosures": "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0-3-3 3 3 0 0 0 3 3z",
  "/admin/audit": "M11 19a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm10 2-4.3-4.3",
  "/admin/reports": "M4 19h16M7 16V9m5 7V5m5 11v-7",
  "/admin/flags": "M5 4v16M5 5h12l-2 4 2 4H5",
  "/admin/policies": "M7 4h10v16H7V4zm3 4h4M10 12h4",
  "/admin/jobs": "M9 7V5h6v2M5 7h14v12H5V7z",
  "/admin/chapters": "M12 21s7-5.4 7-11a7 7 0 0 0-14 0c0 5.6 7 11 7 11zm0-8a3 3 0 1 0-3-3 3 3 0 0 0 3 3z",
  "/admin/programmes": "M5 4h14v16H5V4zm3 4h8M8 12h8M8 16h5",
  "/admin/coordinators": "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0",
  "/admin/tickets": "M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7z",
  "/admin/complaints": "M12 3l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z",
  "/admin/appeals": "M12 3v18M5 7h14M6 12h12M8 17h8",
  "/admin/security-notices": "M12 3l8 4v6c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V7l8-4z",
  "/admin/requests": "M4 6h16v12H4V6zm4 4h8M8 14h5",
};

function NavIcon({ href }: { href: string }) {
  const d = ICON[href] ?? "M5 12h14";
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden>
      <path d={d} />
    </svg>
  );
}
