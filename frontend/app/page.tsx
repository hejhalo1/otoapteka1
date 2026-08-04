import { HomeSearch } from "@/components/home/HomeSearch";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10">
      {/* Nagłówek dla SEO/czytników — wizualnie strona od razu przechodzi do akcji. */}
      <h1 className="sr-only">
        Znajdź najbliższą otwartą aptekę — dystans, czas dojścia i godziny otwarcia
      </h1>
      <HomeSearch />
    </div>
  );
}
