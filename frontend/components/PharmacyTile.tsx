import { cn } from "@/lib/utils";

/**
 * Kafelek apteki: zielone tło + biały krzyż apteczny. Zastępuje zdjęcia (których
 * nie wolno nam pobierać z zewnątrz) prostym, spójnym znakiem — bez kolorowania
 * per sieć. Dekoracyjny: nazwa apteki jest obok w nagłówku, więc aria-hidden.
 */
export function PharmacyTile({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-xl border border-pharma-dark/20 bg-pharma shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 text-white" fill="currentColor">
        <path d="M9.4 2.8h5.2a1.4 1.4 0 0 1 1.4 1.4V8h3.8a1.4 1.4 0 0 1 1.4 1.4v5.2a1.4 1.4 0 0 1-1.4 1.4h-3.8v3.8a1.4 1.4 0 0 1-1.4 1.4H9.4a1.4 1.4 0 0 1-1.4-1.4v-3.8H4.2a1.4 1.4 0 0 1-1.4-1.4V9.4A1.4 1.4 0 0 1 4.2 8H8V4.2a1.4 1.4 0 0 1 1.4-1.4z" />
      </svg>
    </div>
  );
}
