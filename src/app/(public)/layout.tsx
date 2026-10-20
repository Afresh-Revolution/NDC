import { PublicFooter, PublicHeader } from "@/components/public/PublicChrome";

export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </>
  );
}
