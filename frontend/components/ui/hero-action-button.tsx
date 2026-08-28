"use client";

import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroActionTheme = "red" | "blue" | "navy";

// Motywy dopasowane do palety serwisu (czerwony = główna akcja, niebieski = mapa),
// gradienty przez inline-style (pewne kolory, bez problemów z JIT Tailwinda).
const THEMES: Record<
  HeroActionTheme,
  { border: string; gradient: string; shadow: string }
> = {
  red: {
    border: "#dc2626",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 55%, #b91c1c 100%)",
    shadow: "0 12px 30px -8px rgba(220,38,38,0.45)",
  },
  blue: {
    border: "#0b4f9e",
    gradient: "linear-gradient(135deg, #2b6fd0 0%, #0b4f9e 55%, #083a72 100%)",
    shadow: "0 12px 30px -8px rgba(11,79,158,0.45)",
  },
  navy: {
    border: "#122c47",
    gradient: "linear-gradient(135deg, #22456f 0%, #122c47 60%, #0b1f38 100%)",
    shadow: "0 12px 30px -8px rgba(18,44,71,0.45)",
  },
};

interface HeroActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  theme?: HeroActionTheme;
  loading?: boolean;
}

/**
 * Przycisk-kafel akcji hero: ikona w kaflu, tytuł + podtytuł, przesuwający się
 * połysk, poświata na hover i strzałka. Wariant kolorystyczny (czerwony/niebieski)
 * przez `theme`. Obsługuje stan `loading` (spinner + wyłączenie).
 */
export function HeroActionButton({
  icon,
  title,
  subtitle,
  theme = "blue",
  loading = false,
  className,
  disabled,
  ...props
}: HeroActionButtonProps) {
  const t = THEMES[theme];
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      style={{ backgroundImage: t.gradient, borderColor: t.border, boxShadow: t.shadow }}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border-2 p-4 text-left",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-1 hover:scale-[1.02] hover:brightness-[1.04] active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:brightness-100",
        "sm:w-[320px]",
        className,
      )}
    >
      {/* Połysk przesuwający się w poprzek na hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full"
      />
      {/* Delikatna poświata na hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <span className="relative z-10 flex items-center gap-3.5">
        {/* Ikona w kaflu */}
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-sm transition-all duration-300 group-hover:bg-white/25 [&_svg]:h-6 [&_svg]:w-6">
          {loading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : icon}
        </span>

        {/* Teksty */}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-extrabold text-white drop-shadow-sm">
            {title}
          </span>
          {subtitle && (
            <span className="block truncate text-sm text-white/75 transition-colors duration-300 group-hover:text-white/90">
              {subtitle}
            </span>
          )}
        </span>

        {/* Strzałka */}
        <ArrowRight
          aria-hidden
          className="h-5 w-5 shrink-0 text-white opacity-50 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
        />
      </span>
    </button>
  );
}
