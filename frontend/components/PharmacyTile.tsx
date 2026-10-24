import { cn } from "@/lib/utils";

/**
 * Miejsce na zdjęcie apteki (placeholder). Dopóki apteka nie doda własnego zdjęcia
 * (po kontakcie z nami), pokazujemy lekki, jasny kafelek z krzyżem aptecznym —
 * bez ramek, żeby nie odciągał uwagi od informacji. Dekoracyjny → aria-hidden.
 */
export function PharmacyTile({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-pharma-soft to-[#eef4fb]",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-2/5 w-2/5 text-pharma"
        fill="white"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d="M9.4 2.8h5.2a1.4 1.4 0 0 1 1.4 1.4V8h3.8a1.4 1.4 0 0 1 1.4 1.4v5.2a1.4 1.4 0 0 1-1.4 1.4h-3.8v3.8a1.4 1.4 0 0 1-1.4 1.4H9.4a1.4 1.4 0 0 1-1.4-1.4v-3.8H4.2a1.4 1.4 0 0 1-1.4-1.4V9.4A1.4 1.4 0 0 1 4.2 8H8V4.2a1.4 1.4 0 0 1 1.4-1.4z" />
      </svg>
    </div>
  );
}
