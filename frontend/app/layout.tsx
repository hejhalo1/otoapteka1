import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Self-hosted (zero requestów zewnętrznych), z polskimi znakami.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "otoapteka.pl — znajdź najbliższą otwartą aptekę",
    template: "%s | otoapteka.pl",
  },
  description:
    "Lokalizator aptek w Polsce. W kilka sekund zobacz najbliższą, aktualnie otwartą aptekę, dystans, czas dojścia i dojazdu oraz komunikaty apteki.",
  applicationName: "otoapteka.pl",
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "otoapteka.pl",
    title: "otoapteka.pl — znajdź najbliższą otwartą aptekę",
    description:
      "Najbliższa, aktualnie otwarta apteka — dystans, czas dojścia i dojazdu, godziny otwarcia i komunikaty.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f2a47",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
