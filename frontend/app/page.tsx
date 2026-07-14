import { PharmacyList } from "@/components/PharmacyList";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Najbliższa <span className="text-teal">otwarta apteka</span>
          <br className="hidden sm:block" /> w kilka sekund
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Zobacz dystans, czas dojścia i dojazdu, godziny otwarcia i komunikaty apteki —
          wszystko na jednej karcie.
        </p>
      </section>

      <PharmacyList />
    </div>
  );
}
