import type { NextConfig } from "next";

// Hosty z env (kafelki OSM + API backendu) potrzebne w CSP.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
let tileHost = "https://tile.openstreetmap.org";
try {
  tileHost = new URL(process.env.NEXT_PUBLIC_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png").origin;
} catch {
  /* zostaw domyślny */
}

// Hosty CartoDB — rastrowe kafle Positron (zwykłe obrazki → tylko img-src).
const carto = "https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com";

// OpenFreeMap — darmowe kafelki wektorowe + fonty dla MapLibre GL (styl „toner").
// Pobierane fetch-em (.pbf) → muszą być w connect-src.
const openfreemap = "https://tiles.openfreemap.org";

// W trybie deweloperskim Next/Turbopack (HMR, React Refresh) oraz ładowanie chunku
// workera MapLibre wymagają 'unsafe-eval'. Produkcja zostaje ścisła (bez eval).
const isDev = process.env.NODE_ENV !== "production";

// CSP: 'unsafe-inline' dla script/style to pragmatyczny kompromis z Next.
// MapLibre GL: worker z blob:, kafelki wektorowe + fonty z OpenFreeMap (connect-src).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' blob:${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  // MapLibre GL tworzy web workera z blob: URL (worker-src + child-src dla starszych przeglądarek).
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  `img-src 'self' data: blob: ${tileHost} ${apiUrl} ${carto}`,
  `connect-src 'self' ${apiUrl} ${openfreemap}`,
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
];

const api = new URL(apiUrl);

const nextConfig: NextConfig = {
  // Zdjęcia aptek serwuje backend (uploads po moderacji) — zezwalamy next/image
  // wyłącznie na hosta API.
  images: {
    remotePatterns: [
      {
        protocol: api.protocol === "https:" ? "https" : "http",
        hostname: api.hostname,
        port: api.port,
        pathname: "/uploads/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
