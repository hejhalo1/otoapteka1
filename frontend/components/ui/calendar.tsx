"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Kalendarz (single-select) dostosowany do palety serwisu i po polsku. Bazuje na
// gotowym snippecie, ale bez zależności HeroUI/Select/cva — miesiąc przełączamy
// strzałkami (zakres dat i tak jest wąski: dziś…+30). Animowana zmiana miesiąca.

const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];
const WEEKDAYS_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"]; // poniedziałek-first

type DayVariant = "default" | "selected" | "today" | "outside" | "disabled";

const DAY_BASE =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none";
const DAY_VARIANTS: Record<DayVariant, string> = {
  default: "text-ink hover:bg-pharma-soft",
  selected: "bg-pharma font-bold text-white hover:bg-pharma-dark",
  today: "bg-pharma-soft font-bold text-pharma-dark ring-1 ring-inset ring-pharma/30",
  outside: "text-muted opacity-50 hover:bg-pharma-soft",
  disabled: "cursor-not-allowed text-muted opacity-30",
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 44 : -44, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -44 : 44, opacity: 0 }),
};

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: (date: Date) => boolean;
  showOutsideDays?: boolean;
  className?: string;
}

export function Calendar({
  selected,
  onSelect,
  minDate,
  maxDate,
  disabled,
  showOutsideDays = true,
  className,
}: CalendarProps) {
  const [view, setView] = React.useState<Date>(selected ?? new Date());
  const [dir, setDir] = React.useState<1 | -1>(1);
  const today = new Date();

  const year = view.getFullYear();
  const month = view.getMonth();

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // poniedziałek = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthLast = new Date(year, month, 0).getDate();

  const prevDays = Array.from(
    { length: firstDow },
    (_, i) => prevMonthLast - firstDow + i + 1,
  );
  const curDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7; // 35 lub 42
  const nextDays = Array.from(
    { length: totalCells - prevDays.length - curDays.length },
    (_, i) => i + 1,
  );

  const isDisabled = (d: Date): boolean => {
    if (disabled?.(d)) return true;
    if (minDate && d < stripTime(minDate)) return true;
    if (maxDate && d > stripTime(maxDate)) return true;
    return false;
  };

  const variantFor = (d: Date, offset: number): DayVariant => {
    if (isDisabled(d)) return "disabled";
    if (selected && isSameDay(d, selected)) return "selected";
    if (isSameDay(d, today)) return "today";
    if (offset !== 0) return "outside";
    return "default";
  };

  const nav = (delta: 1 | -1) => {
    setDir(delta);
    setView(new Date(year, month + delta, 1));
  };

  const cell = (day: number, offset: number, key: string) => {
    const d = new Date(year, month + offset, day);
    const off = isDisabled(d);
    return (
      <button
        key={key}
        type="button"
        disabled={off}
        onClick={() => !off && onSelect?.(d)}
        className={cn(DAY_BASE, DAY_VARIANTS[variantFor(d, offset)])}
      >
        {day}
      </button>
    );
  };

  return (
    <div
      className={cn(
        "w-[300px] rounded-2xl border bg-surface p-3 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {/* Nagłówek: nawigacja miesięcy */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => nav(-1)}
          aria-label="Poprzedni miesiąc"
          className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-pharma-soft hover:text-pharma-dark"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${month}-${year}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-extrabold text-ink"
            >
              {MONTHS_PL[month]} {year}
            </motion.div>
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => nav(1)}
          aria-label="Następny miesiąc"
          className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-pharma-soft hover:text-pharma-dark"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Dni tygodnia */}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS_PL.map((w) => (
          <div key={w} className="grid h-8 place-items-center text-xs font-semibold text-muted">
            {w}
          </div>
        ))}
      </div>

      {/* Siatka dni (przesuwana przy zmianie miesiąca) */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={`${month}-${year}`}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 500, damping: 34 },
              opacity: { duration: 0.15 },
            }}
            className="grid grid-cols-7 gap-0.5"
          >
            {showOutsideDays && prevDays.map((day) => cell(day, -1, `p-${day}`))}
            {curDays.map((day) => cell(day, 0, `c-${day}`))}
            {showOutsideDays && nextDays.map((day) => cell(day, 1, `n-${day}`))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
