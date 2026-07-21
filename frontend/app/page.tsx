import { BadgeCheck, Clock, MapPin, Megaphone } from "lucide-react";
import { PharmacyList } from "@/components/PharmacyList";
import { HeroCta } from "@/components/HeroCta";
import { HeroMap } from "@/components/HeroMap";
import { Reveal } from "@/components/ui/Reveal";

const FEATURES = [
  { Icon: BadgeCheck, label: "Tylko czynne apteki" },
  { Icon: Clock, label: "Aktualne godziny" },
  { Icon: MapPin, label: "Odległość w metrach" },
  { Icon: Megaphone, label: "Info z apteki" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* ---- Hero ---- */}
      <section className="relative isolate grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        {/* Miękkie plamy światła w tle — głębia bez rozpraszania. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-floaty absolute -top-20 right-[4%] h-72 w-72 rounded-full bg-pharma-soft opacity-80 blur-3xl" />
          <div className="absolute bottom-0 left-[-6%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            Znajdź
            <br />
            najbliższą <span className="text-pharma">aptekę</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-ink-soft">
            Sprawdź, która apteka jest otwarta i&nbsp;jak szybko do niej dotrzesz.
          </p>
          <div className="mt-7">
            <HeroCta />
          </div>
        </div>
        <div className="aspect-[4/3] lg:aspect-auto lg:h-[420px]">
          <HeroMap />
        </div>
      </section>

      {/* ---- Atuty ---- */}
      <Reveal>
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y py-4 text-sm font-semibold text-ink-soft">
          {FEATURES.map(({ Icon, label }) => (
            <li
              key={label}
              className="group flex cursor-default items-center gap-2 transition-colors duration-300 hover:text-ink"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-pharma-soft text-pharma transition-all duration-300 [transition-timing-function:var(--ease-spring)] group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-pharma group-hover:text-white group-hover:shadow-[0_4px_12px_rgba(39,156,83,0.35)]">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </Reveal>

      {/* ---- Lista aptek ---- */}
      <section id="apteki" className="scroll-mt-20 py-8">
        <PharmacyList />
      </section>
    </div>
  );
}
