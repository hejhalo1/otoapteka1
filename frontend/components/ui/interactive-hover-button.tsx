import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: React.ReactNode;
}

/**
 * Główne CTA z „żywym” hoverem — wyłącznie transformy GPU, więc idealnie płynne:
 * - ciemniejsza fala przesuwa się od lewej (scale-x na osi origin-left),
 * - etykieta roluje się pionowo: domyślna zjeżdża w górę, od dołu wjeżdża
 *   wersja ze strzałką — jeden kierunek, wspólny timing, zero krzyżowania.
 */
const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Dalej", icon, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group pressable relative cursor-pointer overflow-hidden rounded-2xl bg-primary p-4 text-center text-lg font-bold text-white",
        "shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]",
        "disabled:cursor-default disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {/* Fala koloru — czysty transform (scale-x), w pełni płynna. */}
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 bg-primary-dark transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:scale-x-100 group-disabled:hidden"
      />
      {/* Pionowa rolka etykiety. */}
      <span className="relative z-10 block overflow-hidden">
        <span className="flex items-center justify-center gap-2.5 transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:-translate-y-[115%] group-disabled:transition-none group-disabled:group-hover:translate-y-0">
          {icon}
          {text}
        </span>
        <span
          aria-hidden
          className="absolute inset-0 flex translate-y-[115%] items-center justify-center gap-2.5 transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:translate-y-0 group-disabled:hidden"
        >
          {text}
          <ArrowRight className="h-5 w-5" />
        </span>
      </span>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
