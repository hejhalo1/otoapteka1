import type { Metadata } from "next";
import NearbyAnnouncements from "@/components/feeds/NearbyAnnouncements";

export const metadata: Metadata = {
  title: "Info z aptek w okolicy",
  description: "Najnowsze komunikaty, usługi i informacje z aptek najbliżej Ciebie.",
  alternates: { canonical: "/info-z-aptek" },
};

export default function InfoZAptekPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:pt-8">
      <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
        Info z aptek w okolicy
      </h1>
      <p className="mb-6 mt-1 max-w-2xl text-muted">
        Najnowsze komunikaty, usługi i informacje z aptek najbliżej Ciebie.
      </p>
      <NearbyAnnouncements />
    </div>
  );
}
