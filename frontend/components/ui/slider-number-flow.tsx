"use client";

import NumberFlow from "@number-flow/react";
import * as RadixSlider from "@radix-ui/react-slider";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type NumberFlowProps = ComponentProps<typeof NumberFlow>;

// Slider z animowaną liczbą (NumberFlow) — bazuje na gotowym snippecie, dostosowany
// do palety serwisu (niebieski). `display` pokazuje inną wartość niż value[0] (u nas
// km zamiast indeksu pozycji — kroki promienia są nierówne). `valueLabel`:
//   "thumb"  — pigułka nad kciukiem (oryginał),
//   "inline" — liczba obok toru, bez tła (kompaktowo, do paska filtrów),
//   "none"   — sam suwak.
interface SliderProps extends RadixSlider.SliderProps {
  display?: number;
  format?: NumberFlowProps["format"];
  locales?: NumberFlowProps["locales"];
  valueLabel?: "thumb" | "inline" | "none";
}

const NUMBERFLOW_COMMON = {
  willChange: true,
  isolate: true,
  opacityTiming: { duration: 250, easing: "ease-out" },
  transformTiming: {
    easing: `linear(0, 0.0033 0.8%, 0.0263 2.39%, 0.0896 4.77%, 0.4676 15.12%, 0.5688, 0.6553, 0.7274, 0.7862, 0.8336 31.04%, 0.8793, 0.9132 38.99%, 0.9421 43.77%, 0.9642 49.34%, 0.9796 55.71%, 0.9893 62.87%, 0.9952 71.62%, 0.9983 82.76%, 0.9996 99.47%)`,
    duration: 500,
  },
};

export function Slider({
  value,
  className,
  display,
  format = { style: "unit", unit: "kilometer", unitDisplay: "short" },
  locales = "pl-PL",
  valueLabel = "thumb",
  ...props
}: SliderProps) {
  const shown = display ?? value?.[0];

  const root = (
    <RadixSlider.Root
      {...props}
      value={value}
      className={cn(
        "relative flex h-5 w-full touch-none select-none items-center",
        className,
      )}
    >
      <RadixSlider.Track className="relative h-1.5 grow rounded-full bg-line">
        <RadixSlider.Range className="absolute h-full rounded-full bg-pharma" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="relative block h-4 w-4 rounded-full bg-white shadow-md ring-2 ring-pharma/30 transition-shadow hover:ring-pharma/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pharma"
        aria-label="Promień wyszukiwania"
      >
        {valueLabel === "thumb" && shown != null && (
          <NumberFlow
            {...NUMBERFLOW_COMMON}
            value={shown}
            format={format}
            locales={locales}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-pharma px-2 py-0.5 text-sm font-bold tabular-nums text-white shadow-[var(--shadow-card)]"
          />
        )}
      </RadixSlider.Thumb>
    </RadixSlider.Root>
  );

  if (valueLabel === "inline" && shown != null) {
    return (
      <div className="flex items-center gap-2">
        {root}
        <NumberFlow
          {...NUMBERFLOW_COMMON}
          value={shown}
          format={format}
          locales={locales}
          className="whitespace-nowrap text-sm font-bold tabular-nums text-pharma-dark"
        />
      </div>
    );
  }

  return root;
}

export default Slider;
