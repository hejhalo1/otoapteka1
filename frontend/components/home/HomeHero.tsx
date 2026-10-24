import { PulseFitHero } from "@/components/ui/pulse-fit-hero";
import { HomeShowcase } from "./HomeShowcase";

/**
 * Hero strony głównej: szeroki baner z ilustracją + nagłówkiem i trzema kartami-wejściami
 * (najbliższa apteka / info z aptek / dyżury). Zawartość składa `HomeShowcase`.
 */
export function HomeHero({
  locating,
  geoError,
  onLocate,
}: {
  locating: boolean;
  geoError: string | null;
  onLocate: () => void;
}) {
  return (
    <PulseFitHero showHeader={false}>
      <HomeShowcase locating={locating} geoError={geoError} onLocate={onLocate} />
    </PulseFitHero>
  );
}
