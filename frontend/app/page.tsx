import { HomeSearch } from "@/components/home/HomeSearch";

export default function HomePage() {
  // Hero jest pełnej szerokości (własny jasny gradient), więc bez kontenera —
  // sekcja wyników sama nakłada max-w-7xl. Widoczny <h1> jest w hero (PulseFitHero).
  return <HomeSearch />;
}
