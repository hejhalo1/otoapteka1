import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapa aptek",
  description:
    "Znajdź aptekę na mapie. Wskaż punkt lub użyj swojej lokalizacji, aby zobaczyć najbliższe apteki na mapie OpenStreetMap.",
  alternates: { canonical: "/mapa" },
};

export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
