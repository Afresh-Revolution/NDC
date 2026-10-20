import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Syne } from "next/font/google";
import "@/styles/globals.scss";
import { IdleSnake } from "@/components/IdleSnake";
import { PixelField } from "@/components/PixelField";
import { ThemeScript } from "@/components/ThemeScript";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans-actual",
});

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display-actual",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-actual",
});

export const metadata: Metadata = {
  title: {
    default: "NDC Naija — Northside Developers Cooperative",
    template: "%s · NDC Naija",
  },
  description:
    "A proposed member-owned institution for software developers in Northern Nigeria. Cooperative savings, vetted collaboration, venture preparation, and shared infrastructure — without guaranteed loans or returns.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/brand/ndc-logo.png",
    apple: "/brand/ndc-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeScript />
        <PixelField />
        <div className="app-layer">{children}</div>
        <IdleSnake />
      </body>
    </html>
  );
}
