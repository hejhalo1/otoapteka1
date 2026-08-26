"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

/**
 * Nav w stylu „tubelight": pigułka z pozycjami, a pod aktywną przesuwa się
 * podświetlenie (framer-motion `layoutId`). Bez efektu glow — sam ślizgający się
 * jasny kafelek. Aktywność wg trasy (`usePathname`), więc przejścia między
 * stronami animują wskaźnik (Header trwa w layoucie).
 */
export function TubelightNav({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex items-center gap-1 rounded-full border border-line bg-bg p-1",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);

        return (
          <Link
            key={item.name}
            href={item.url}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-5",
              isActive ? "text-primary" : "text-ink-soft hover:text-primary",
            )}
          >
            <span className="relative z-10 hidden sm:inline">{item.name}</span>
            <span className="relative z-10 sm:hidden">
              <Icon size={18} strokeWidth={2.4} aria-hidden />
            </span>
            {isActive && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-full bg-pharma-soft"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
