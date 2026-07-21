"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SegmentOption {
  value: string;
  label: React.ReactNode;
}

/**
 * Przełącznik segmentowy z płynnie przesuwającym się wskaźnikiem (pigułką).
 * Wskaźnik pozycjonowany po offsetach aktywnego przycisku — działa dla
 * dowolnych szerokości etykiet i reaguje na resize.
 */
export function SegmentedTabs({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const el = refs.current.get(value);
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [value, options]);

  return (
    <div
      className={cn("relative flex items-center rounded-full border bg-surface p-1", className)}
      role="tablist"
    >
      {pill && (
        <span
          aria-hidden
          className="absolute bottom-1 top-1 rounded-full bg-ink shadow-sm transition-all duration-300 [transition-timing-function:var(--ease-out)]"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              if (el) refs.current.set(o.value, el);
              else refs.current.delete(o.value);
            }}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300",
              active ? "text-white" : "text-ink-soft hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
