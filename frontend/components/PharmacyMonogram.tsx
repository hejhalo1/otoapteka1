import { brandFor } from "@/lib/pharmacy-brand";
import { cn } from "@/lib/utils";

/**
 * Kafelek apteki generowany z barw sieci (zamiast zdjęcia — których nie wolno nam
 * pobierać z zewnątrz). DOZ → pomarańczowo-niebieski, Ziko → zielony itd.; apteki
 * bez rozpoznanej sieci dostają odcień zieleni. Zawiera monogram + znak krzyża.
 */
export function PharmacyMonogram({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const b = brandFor(name);
  return (
    <div
      role="img"
      aria-label={b.chain ? `Logo sieci ${b.chain}` : `Apteka ${name}`}
      title={b.chain ?? name}
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-xl border shadow-sm",
        className,
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${b.from}, ${b.to})`, color: b.fg }}
    >
      {/* Znak krzyża aptecznego jako subtelny watermark. */}
      <svg
        viewBox="0 0 24 24"
        className="absolute -right-2 -top-2 h-12 w-12 opacity-20"
        fill="currentColor"
        aria-hidden
      >
        <path d="M9.1 2.6h5.8a1.3 1.3 0 0 1 1.3 1.3v5h5a1.3 1.3 0 0 1 1.3 1.3v5.8a1.3 1.3 0 0 1-1.3 1.3h-5v5a1.3 1.3 0 0 1-1.3 1.3H9.1a1.3 1.3 0 0 1-1.3-1.3v-5h-5a1.3 1.3 0 0 1-1.3-1.3v-5.8a1.3 1.3 0 0 1 1.3-1.3h5v-5a1.3 1.3 0 0 1 1.3-1.3z" />
      </svg>
      <span className="relative z-10 px-1 text-center text-xl font-extrabold leading-none tracking-tight drop-shadow-sm">
        {b.initials}
      </span>
    </div>
  );
}
