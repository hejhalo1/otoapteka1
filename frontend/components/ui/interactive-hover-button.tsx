import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: React.ReactNode;
}

/**
 * Przycisk z „żywym” hoverem: bazowo pełny kolor primary; przy hoverze od lewej
 * rozlewa się ciemniejsza fala, etykieta zjeżdża, a wjeżdża wersja ze strzałką.
 * Adaptacja wzorca interactive-hover-button (shadcn community) do palety otoapteka.
 */
const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Dalej", icon, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group pressable relative cursor-pointer overflow-hidden rounded-2xl bg-primary p-4 text-center text-lg font-bold text-white shadow-[var(--shadow-card)]",
        "disabled:cursor-default disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <span className="relative z-20 inline-flex items-center justify-center gap-2.5 transition-all duration-300 group-hover:translate-x-10 group-hover:opacity-0 group-disabled:transition-none">
        {icon}
        {text}
      </span>
      <div className="absolute inset-0 z-20 flex translate-x-10 items-center justify-center gap-2.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-disabled:hidden">
        <span>{text}</span>
        <ArrowRight className="h-5 w-5" aria-hidden />
      </div>
      {/* Fala koloru rozrastająca się z lewej krawędzi. */}
      <div
        aria-hidden
        className="absolute left-[8%] top-[45%] z-10 h-2 w-2 scale-100 rounded-full bg-primary-dark transition-all duration-300 group-hover:left-0 group-hover:top-0 group-hover:h-full group-hover:w-full group-hover:scale-[1.8] group-hover:rounded-none group-disabled:hidden"
      />
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
