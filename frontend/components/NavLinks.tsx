"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LocateFixed, Map as MapIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/mapa", label: "Mapa", Icon: MapIcon },
  { href: "/ulubione", label: "Ulubione", Icon: Heart },
  { href: "/o-serwisie", label: "O nas", Icon: Info },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-0.5 text-sm font-semibold sm:gap-1">
      {LINKS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "pressable group relative rounded-lg px-2.5 py-2 text-ink-soft transition-colors hover:text-ink sm:px-3",
              active && "text-ink",
            )}
          >
            <span className="flex items-center gap-1.5">
              <Icon className="h-4 w-4 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </span>
            {/* Animowane podkreślenie — rośnie od środka. */}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-2.5 -bottom-0.5 h-0.5 origin-center scale-x-0 rounded-full bg-pharma transition-transform duration-300 [transition-timing-function:var(--ease-out)] group-hover:scale-x-100",
                active && "scale-x-100",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * „Moja lokalizacja” w headerze: na stronie głównej odpala geolokalizację
 * (event nasłuchiwany przez listę), z innych stron wraca na główną z flagą.
 */
export function LocateButton() {
  const pathname = usePathname();
  const router = useRouter();

  const onClick = () => {
    if (pathname === "/") {
      window.dispatchEvent(new Event("otoapteka:locate"));
    } else {
      router.push("/?lokalizuj=1");
    }
  };

  return (
    <button
      onClick={onClick}
      className="pressable group flex items-center gap-2 rounded-full border-2 border-ink/15 px-3 py-2 text-sm font-bold text-ink transition-colors hover:border-pharma hover:text-pharma sm:px-4"
    >
      <LocateFixed
        className="h-4 w-4 transition-transform duration-500 [transition-timing-function:var(--ease-spring)] group-hover:rotate-45"
        aria-hidden
      />
      <span className="hidden sm:inline">Moja lokalizacja</span>
    </button>
  );
}
