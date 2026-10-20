import { requireUser } from "@/app/actions/auth";
import { PublicHeader } from "@/components/public/PublicChrome";
import Link from "next/link";

const STEPS = [
  ["Identity", "/onboarding/identity"],
  ["Skills", "/onboarding/skills"],
  ["Portfolio", "/onboarding/portfolio"],
  ["Declarations", "/onboarding/declarations"],
  ["Payment", "/onboarding/payment"],
  ["Status", "/onboarding/status"],
];

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <PublicHeader />
      <div className="container" style={{ padding: "2rem 0 4rem" }}>
        <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {STEPS.map(([label, href]) => (
            <Link key={href} href={href} className="tag">
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </>
  );
}
