import { requireUser } from "@/app/actions/auth";
import { AppShell } from "@/components/app/AppShell";

const NAV = [
  { group: "Account", href: "/workspace", label: "Dashboard" },
  { group: "Account", href: "/workspace/card", label: "Digital card" },
  { group: "Account", href: "/workspace/profile", label: "Profile" },
  { group: "Account", href: "/workspace/skills", label: "Skills" },
  { group: "Account", href: "/workspace/billing", label: "Billing" },
  { group: "Account", href: "/workspace/contributions", label: "Contributions" },
  { group: "Account", href: "/workspace/statement", label: "Statement" },
  { group: "Account", href: "/workspace/withdrawals", label: "Withdrawals" },
  { group: "Account", href: "/workspace/shares", label: "Share capital" },
  { group: "Account", href: "/workspace/renewals", label: "Renewals" },
  { group: "Account", href: "/workspace/notices", label: "Notices" },
  { group: "Account", href: "/workspace/sessions", label: "Sessions" },
  { group: "Account", href: "/workspace/settings", label: "Settings" },
  { group: "Account", href: "/workspace/data-rights", label: "Data rights" },
  { group: "Projects", href: "/workspace/projects", label: "My projects" },
  { group: "Projects", href: "/workspace/projects/new", label: "Submit project" },
  { group: "Studio", href: "/workspace/studio", label: "Opportunity board" },
  { group: "Studio", href: "/workspace/studio/apply", label: "Apply" },
  { group: "Studio", href: "/workspace/studio/timesheets", label: "Timesheets" },
  { group: "Studio", href: "/workspace/studio/payouts", label: "Payouts" },
  { group: "Studio", href: "/workspace/studio/disputes", label: "Disputes" },
  { group: "Learning", href: "/workspace/learn/mentorship", label: "Mentorship" },
  { group: "Learning", href: "/workspace/learn/programmes", label: "Programmes" },
  { group: "Learning", href: "/workspace/learn/events", label: "Events" },
  { group: "Learning", href: "/workspace/learn/oss", label: "Open source" },
  { group: "Learning", href: "/workspace/learn/communities", label: "Communities" },
  { group: "Learning", href: "/workspace/learn/resources", label: "Resources" },
  { group: "Learning", href: "/workspace/learn/feedback", label: "Feedback" },
];

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={user} title="Member workspace" nav={NAV}>
      {children}
    </AppShell>
  );
}
