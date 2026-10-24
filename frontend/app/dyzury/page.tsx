import type { Metadata } from "next";
import NearbyDuties from "@/components/feeds/NearbyDuties";

export const metadata: Metadata = {
  title: "Apteki dyżurne w okolicy",
  description: "Sprawdź, która apteka pełni dyżur najbliżej Ciebie i w jakich godzinach.",
  alternates: { canonical: "/dyzury" },
};

export default function DyzuryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:pt-8">
      <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
        Apteki dyżurne w okolicy
      </h1>
      <p className="mb-6 mt-1 max-w-2xl text-muted">
        Apteki pełniące dyżur najbliżej Ciebie oraz godziny dyżurów.
      </p>
      <NearbyDuties />
    </div>
  );
}
