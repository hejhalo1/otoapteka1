import type { RouteMode } from "@/lib/types";
import { formatDistance, formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Plakietka na mapie: długość trasy + czas dojścia/dojazdu. Pozycję (lewo/prawo) daje className. */
export function RouteBadge({
  title,
  distanceMeters,
  minutes,
  mode,
  className,
}: {
  title?: string;
  distanceMeters: number;
  minutes: number;
  mode: RouteMode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-3 z-[500] rounded-md bg-surface/95 px-3.5 py-2 shadow-[var(--shadow-card)] backdrop-blur",
        className,
      )}
    >
      {title && (
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{title}</div>
      )}
      <div className="text-base font-black tabular-nums text-pharma-dark">
        {formatDistance(distanceMeters)}
      </div>
      <div className="text-xs font-semibold text-muted">
        {formatMinutes(minutes)} {mode === "walk" ? "pieszo" : "autem"}
      </div>
    </div>
  );
}
