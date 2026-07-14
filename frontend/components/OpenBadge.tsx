import type { OpenStatus } from "@/lib/types";
import { statusMeta } from "@/lib/format";

// Status = kolor + ikona + tekst (nigdy sam kolor — dostępność WCAG).
export function OpenBadge({ status, size = "md" }: { status: OpenStatus; size?: "sm" | "md" }) {
  const meta = statusMeta(status);
  const pad = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad} ${meta.className}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full ${meta.dot} text-[10px] font-bold text-white`} aria-hidden>
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}
