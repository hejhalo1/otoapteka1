import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wycofane leki",
  description: "Leki wycofane z obrotu i wstrzymane decyzją Głównego Inspektora Farmaceutycznego.",
  alternates: { canonical: "/wycofane-leki" },
};

export default function WycofaneLekiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:pt-8">
      <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
        Wycofane leki
      </h1>
      <p className="mb-6 mt-1 max-w-2xl text-muted">
        Leki wycofane z obrotu i wstrzymane decyzją Głównego Inspektora Farmaceutycznego.
      </p>
      <div className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          Lista wycofanych leków pojawi się tu wkrótce. Do tego czasu aktualne decyzje znajdziesz
          w{" "}
          <a
            href="https://rdg.ezdrowie.gov.pl/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink underline underline-offset-2"
          >
            Rejestrze Decyzji GIF
          </a>
          .
        </p>
      </div>
    </div>
  );
}
