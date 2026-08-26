"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { LogoMark, Wordmark } from "./Logo";

const NAV = [
  { label: "Apteki wg miast", href: "/apteki" },
  { label: "Mapa aptek", href: "/mapa" },
  { label: "Ulubione", href: "/ulubione" },
  { label: "O serwisie", href: "/o-serwisie" },
  { label: "Regulamin", href: "/regulamin" },
  { label: "Polityka prywatności", href: "/polityka-prywatnosci" },
  { label: "Panel apteki", href: "/login" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

export function Footer() {
  return (
    <footer className="w-full overflow-hidden bg-primary py-12 text-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
        variants={containerVariants}
        className="mx-auto mb-10 flex max-w-7xl flex-col items-center gap-8 px-4"
      >
        {/* Logo — biała łezka z niebieskim krzyżem + wordmark */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
          <LogoMark variant="onDark" className="h-12" />
          <Wordmark tone="onDark" className="text-2xl" />
        </motion.div>

        {/* Nawigacja */}
        <motion.nav
          variants={itemVariants}
          className="relative z-10 flex flex-wrap justify-center gap-x-4 gap-y-2 text-base font-medium"
        >
          {NAV.map((item) => (
            <motion.div
              key={item.href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative"
            >
              <Link href={item.href} className="relative block rounded-md px-3 py-1.5">
                <span className="relative z-10">{item.label}</span>
                <span className="absolute inset-0 origin-center scale-0 rounded-md bg-white/15 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
              </Link>
            </motion.div>
          ))}
        </motion.nav>
      </motion.div>

      {/* Divider — animowane ukośne paski */}
      <motion.div
        className="h-12 w-full border-y border-white/15 bg-[repeating-linear-gradient(315deg,currentColor_0,currentColor_1px,transparent_0,transparent_50%)] text-white/20"
        style={{ backgroundSize: "10px 10px" }}
        initial={{ backgroundPositionX: "0%" }}
        whileInView={{ backgroundPositionX: "100%" }}
        viewport={{ once: true }}
        transition={{ ease: "linear", duration: 20 }}
      />

      {/* Atrybucja danych + copyright */}
      <div className="mx-auto mt-8 max-w-7xl px-4 text-center">
        <p className="text-xs leading-relaxed text-white/70">
          Dane aptek: Rejestr Aptek (Centrum e-Zdrowia, dane.gov.pl) · Geokodowanie: GUGiK /
          © OpenStreetMap contributors · Mapy: © OpenStreetMap
        </p>
        <p className="mt-3 text-sm text-white/80">
          © {new Date().getFullYear()} otoapteka.pl — wszystkie prawa zastrzeżone
        </p>
      </div>
    </footer>
  );
}
