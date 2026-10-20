import { requireUser } from "@/app/actions/auth";
import { AppShell } from "@/components/app/AppShell";
import { can } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const NAV = [
  { group: "National", href: "/admin", label: "Overview" },
  { group: "National", href: "/admin/verification", label: "Verification" },
  { group: "National", href: "/admin/members", label: "Members" },
  { group: "National", href: "/admin/committees", label: "Committees" },
  { group: "National", href: "/admin/permissions", label: "Permissions" },
  { group: "Finance", href: "/admin/invoices", label: "Invoices" },
  { group: "Finance", href: "/admin/reconciliation", label: "Reconciliation" },
  { group: "Finance", href: "/admin/savings", label: "Savings" },
  { group: "Finance", href: "/admin/treasury", label: "Treasury" },
  { group: "Finance", href: "/admin/exports", label: "Exports" },
  { group: "Funding", href: "/admin/projects", label: "Projects" },
  { group: "Compliance", href: "/admin/sanctions", label: "Sanctions" },
  { group: "Compliance", href: "/admin/disclosures", label: "Disclosures" },
  { group: "Compliance", href: "/admin/audit", label: "Audit log" },
  { group: "Compliance", href: "/admin/reports", label: "Reports" },
  { group: "Platform", href: "/admin/flags", label: "Feature flags" },
  { group: "Platform", href: "/admin/policies", label: "Policies" },
  { group: "Platform", href: "/admin/jobs", label: "Jobs" },
  { group: "Chapter", href: "/admin/chapters", label: "State dashboards" },
  { group: "Chapter", href: "/admin/programmes", label: "Local programmes" },
  { group: "Chapter", href: "/admin/coordinators", label: "Coordinators" },
  { group: "Support", href: "/admin/tickets", label: "Tickets" },
  { group: "Support", href: "/admin/complaints", label: "Complaints" },
  { group: "Support", href: "/admin/appeals", label: "Appeals" },
  { group: "Support", href: "/admin/security-notices", label: "Security notices" },
  { group: "Support", href: "/admin/requests", label: "Data requests" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!can(user, "members.read") && !user.roles.includes("super_admin") && !user.roles.includes("admin")) {
    redirect("/workspace");
  }
  return (
    <AppShell user={user} title="Super admin" nav={NAV} home="/admin">
      {!user.mfaEnabled ? (
        <div className="flash error">MFA is required for admins and payout approvers. <Link href="/workspace/settings">Set up an authenticator</Link> before production payouts.</div>
      ) : null}
      {children}
    </AppShell>
  );
}
