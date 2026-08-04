import type { NextConfig } from "next";

// Hosty z env (kafelki OSM + API backendu) potrzebne w CSP.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
let tileHost = "https://tile.openstreetmap.org";
try {
  tileHost = new URL(process.env.NEXT_PUBLIC_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png").origin;
} catch {
  /* zostaw domyślny */
}

// CSP: 'unsafe-inline' dla script/style to pragmatyczny kompromis z Next+Leaflet
// (docelowo strict CSP z nonce przez middleware). img-src/connect-src dopuszczają
// kafelki OSM i API (w tym /uploads).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  `img-src 'self' data: blob: ${tileHost} ${apiUrl}`,
  `connect-src 'self' ${apiUrl}`,
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
