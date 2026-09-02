"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HeroActionButton } from "@/components/ui/hero-action-button";

interface NavigationItem {
  label: string;
  hasDropdown?: boolean;
  onClick?: () => void;
}

export interface ProgramCard {
  /** Zdjęcie karty. Gdy brak — używamy gradientu + ikony. */
  image?: string;
  gradient?: { from: string; to: string };
  icon?: React.ReactNode;
  category: string;
  title: string;
  desc?: string;
  onClick?: () => void;
}

export interface PulseFitHeroProps {
  /** Nagłówek wewnętrzny — wyłączony, gdy strona ma już globalny <Header/>. */
  showHeader?: boolean;
  /** Dekoracyjne tło (np. <GridPattern/>) — warstwa pod treścią sekcji. */
  background?: React.ReactNode;
  logo?: React.ReactNode;
  navigation?: NavigationItem[];
  ctaButton?: { label: string; onClick: () => void };
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    icon?: React.ReactNode;
    subtitle?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    subtitle?: string;
  };
  /** Dodatkowy slot pod przyciskami (u nas: „lub wpisz miasto" + input). */
  extraContent?: React.ReactNode;
  disclaimer?: React.ReactNode;
  socialProof?: { text: React.ReactNode; image?: string; badges?: Array<{ from: string; to: string }> };
  /** Sekcja pod treścią hero (u nas: galeria + bento). Zastępuje dawną karuzelę. */
  bottomSlot?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

// Domyślne kolory „avatarów" (krzyży) social proof.
const DEFAULT_BADGES = [
  { from: "#0b4f9e", to: "#083a72" },
  { from: "#0891b2", to: "#0e7490" },
  { from: "#4d7c0f", to: "#3f6212" },
  { from: "#b45309", to: "#92400e" },
];

// „Avatar" social proof: krzyż apteczny na gradiencie — zamiast zewnętrznych zdjęć
// (nasze CSP nie dopuszcza obcych hostów, a i tak pasuje tematycznie).
function CrossBadge({ from, to }: { from: string; to: string }) {
  return (
    <span
      className="grid h-10 w-10 place-items-center rounded-full border-2 border-white shadow-sm"
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#fff">
        <path d="M9.6 3h4.8a1.4 1.4 0 0 1 1.4 1.4V8H19a1.4 1.4 0 0 1 1.4 1.4v4.8A1.4 1.4 0 0 1 19 15.6h-3.2v3.6a1.4 1.4 0 0 1-1.4 1.4H9.6a1.4 1.4 0 0 1-1.4-1.4v-3.6H4.6a1.4 1.4 0 0 1-1.4-1.4V9.4A1.4 1.4 0 0 1 4.6 8h3.6V4.4A1.4 1.4 0 0 1 9.6 3z" />
      </svg>
    </span>
  );
}

/**
 * Hero strony głównej w stylu „PulseFit" (framer-motion): jasny gradient, duży
 * animowany tytuł, przyciski akcji, social proof i przewijana karuzela kart. U nas
 * zremiksowany pod apteki — treści i dane własne, wygląd/animacje/layout jak w
 * oryginale. Animacje wygaszane przy `prefers-reduced-motion`.
 */
export function PulseFitHero({
  showHeader = true,
  background,
  logo = "otoapteka.pl",
  navigation = [],
  ctaButton,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  extraContent,
  disclaimer,
  socialProof,
  bottomSlot,
  className,
  children,
}: PulseFitHeroProps) {
  const reduce = useReducedMotion();

  return (
    <section
      className={cn("relative flex w-full flex-col overflow-hidden", className)}
      style={{
        // Przezroczyste — hero dzieli to samo tło strony co wyniki (bez dwutonowości).
        background: "transparent",
      }}
      aria-label="Sekcja główna"
    >
      {/* Dekoracyjne tło (pod treścią; treść ma z-10/z-20). */}
      {background}

      {showHeader && (
        <motion.header
          initial={reduce ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-20 flex flex-row items-center justify-between px-8 py-8 lg:px-16"
        >
          <div className="text-2xl font-bold text-[#1a1a1a]">{logo}</div>
          <nav className="hidden flex-row items-center gap-8 lg:flex" aria-label="Nawigacja">
            {navigation.map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                className="flex flex-row items-center gap-1 text-base text-[#4a5568] transition-opacity hover:opacity-70"
              >
                {item.label}
                {item.hasDropdown && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </nav>
          {ctaButton && (
            <button
              onClick={ctaButton.onClick}
              className="rounded-full border border-[#e2e8f0] bg-white px-6 py-3 text-base font-medium text-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:scale-105"
            >
              {ctaButton.label}
            </button>
          )}
        </motion.header>
      )}

      {children ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full px-4 py-8"
        >
          {children}
        </motion.div>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-4">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex max-w-4xl flex-col items-center gap-8 text-center"
          >
            <h1 className="text-[clamp(36px,6vw,72px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#1a1a1a]">
              {title}
            </h1>
            <p className="max-w-[600px] text-[clamp(16px,2vw,20px)] leading-relaxed text-[#4a5568]">
              {subtitle}
            </p>

            {(primaryAction || secondaryAction) && (
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col items-center gap-4 sm:flex-row"
              >
                {primaryAction && (
                  <HeroActionButton
                    theme="red"
                    icon={primaryAction.icon}
                    title={primaryAction.label}
                    subtitle={primaryAction.subtitle}
                    loading={primaryAction.loading}
                    onClick={primaryAction.onClick}
                  />
                )}
                {secondaryAction && (
                  <HeroActionButton
                    theme="blue"
                    icon={secondaryAction.icon}
                    title={secondaryAction.label}
                    subtitle={secondaryAction.subtitle}
                    onClick={secondaryAction.onClick}
                  />
                )}
              </motion.div>
            )}

            {extraContent && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="w-full max-w-md"
              >
                {extraContent}
              </motion.div>
            )}

            {disclaimer && (
              <motion.p
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-[13px] italic text-[#718096]"
              >
                {disclaimer}
              </motion.p>
            )}

            {socialProof && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-row items-center gap-3"
              >
                {socialProof.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- lokalne, dekoracyjne
                  <img
                    src={socialProof.image}
                    alt=""
                    aria-hidden
                    className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex flex-row -space-x-2">
                    {(socialProof.badges ?? DEFAULT_BADGES).map((b, i) => (
                      <CrossBadge key={i} from={b.from} to={b.to} />
                    ))}
                  </div>
                )}
                <span className="text-sm font-medium text-[#4a5568]">{socialProof.text}</span>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {bottomSlot && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative z-10 w-full px-4 pb-16 pt-2"
        >
          {bottomSlot}
        </motion.div>
      )}
    </section>
  );
}
