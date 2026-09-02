import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/ui/cookie-banner-1";

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
  themeColor: "#122c47",
  width: "device-width",
  initialScale: 1,
};

// Przywraca wybrany rozmiar tekstu (A A A) przed pierwszym paintem — bez FOUC.
const fontScaleScript = `try{var s=localStorage.getItem("otoapteka:fs");if(s==="lg"||s==="xl")document.documentElement.dataset.fs=s}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: fontScaleScript }} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
