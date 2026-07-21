import type { MetadataRoute } from "next";

// Fundament pod przyszłe PWA (service worker to osobna faza).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "otoapteka.pl — lokalizator aptek",
    short_name: "otoapteka",
    description: "Znajdź najbliższą, aktualnie otwartą aptekę w Polsce.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#122c47",
    lang: "pl",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
