# otoapteka.pl

Lokalizator aptek klasy premium dla Polski — **nie sklep i nie porównywarka cen**.
Użytkownik w kilka sekund widzi najbliższą, aktualnie otwartą aptekę: dystans, czas
dojścia i dojazdu, godziny otwarcia i komunikaty apteki.

Monorepo: **backend** (NestJS 11 + Prisma 7 + PostgreSQL 18/PostGIS) i **frontend**
(Next.js 16 App Router + React 19 + Tailwind 4 + Leaflet/OpenStreetMap).

## Architektura

| Warstwa | Technologia |
|---|---|
| Dane aptek | Rejestr Aptek (Centrum e-Zdrowia, dane.gov.pl, dataset 1925) — codzienny sync |
| Baza | PostgreSQL 18 + PostGIS (kolumna `geography`, indeks GiST) |
| Geokodowanie | Nominatim (OpenStreetMap), rate limit 1 req/s, cache w bazie |
| Wyszukiwanie po dystansie | PostGIS `ST_DWithin` + `ST_Distance` |
| Trasy pieszo/autem | estymator haversine (domyślnie) / OSRM (za flagą) |
| Mapa | Leaflet + kafelki OSM |
| Status otwarcia | własny silnik (Europe/Warsaw, poprawny przy DST) — jedyne źródło prawdy |
| Auth | argon2id, JWT (access 15 min + refresh 30 dni z rotacją i reuse-detection) |

**Fundamentalny podział danych:** dane URZĘDOWE (tabela `Pharmacy`, pisze tylko sync)
vs dane DODATKOWE (`PharmacyProfile`/`OpeningHours(PHARMACY)`/`Announcement`/`Photo`,
pisze tylko panel apteki). Fizycznie rozdzielone tabelami.

## Wymagania

- Node.js 20+ (testowane na 24)
- PostgreSQL 18 z rozszerzeniem PostGIS (aktywowane przez pierwszą migrację)

## Uruchomienie — backend

```bash
cd backend
cp .env.example .env          # uzupełnij DATABASE_URL, JWT_*, ADMIN_*
npm install
npx prisma migrate deploy     # tworzy schemat + PostGIS + indeks GiST
npx prisma generate           # generuje klienta (gitignored)
npm run db:seed               # tworzy admina (ADMIN_EMAIL/PASSWORD) + słownik usług
npm run sync -- --no-geocode  # import realnych aptek z rejestru (~21 tys., ~30 s)
npm run geocode -- --limit=100 --city=Warszawa   # geokodowanie partii (1 req/s)
npm run start:dev             # http://localhost:3001/api
```

- **Sync** rejestru: nocny cron (`SYNC_CRON`, Europe/Warsaw) + `POST /api/admin/sync` (ADMIN).
- **Geokodowanie**: publiczny Nominatim throttluje bulk — pełne pokrycie ~12 tys. aptek
  to proces wielu nocy (`GEOCODE_MAX_PER_RUN`/noc) lub self-host Nominatim.

## Uruchomienie — frontend

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL, REVALIDATE_SECRET (= backend)
npm install
npm run dev                   # http://localhost:3000
```

Przed pierwszym buildem produkcyjnym backend powinien być dostępny — `sitemap.xml`
generuje się z listy slugów z API.

## Kluczowe endpointy API

Publiczne (bez auth): `GET /api/pharmacies?lat&lng&radiusKm&openNow&date&page&perPage`,
`GET /api/pharmacies/:slug`, `GET /api/pharmacies/slugs`.
Auth: `POST /api/auth/{register,login,refresh,logout}`, `GET /api/auth/me`.
Panel (PHARMACY_MANAGER): `/api/panel/*`. Admin (ADMIN): `/api/admin/*`.

## Testy i jakość

```bash
cd backend && npm test && npm run lint     # 30 testów (silnik statusu, parser, slug)
cd frontend && npm run build && npx eslint app components lib
```

## Bezpieczeństwo (zrealizowane)

helmet + CSP (Next); ValidationPipe (whitelist); CORS z env; throttling (100/min, auth 5/min);
argon2id; rotacja refresh z reuse-detection (unieważnienie rodziny); cookie httpOnly/SameSite;
guardy IDOR-proof (panel operuje na `user.pharmacyId` z JWT); SQL wyłącznie przez Prisma /
parametryzowany `$queryRaw` (PostGIS); SSRF-whitelist (dane.gov.pl, Nominatim, OSRM);
upload: magic bytes + re-encode sharp→WebP (strip EXIF) + losowa nazwa + moderacja;
lokalizacja użytkownika nigdy nie zapisywana ani logowana (RODO).

## Znane ograniczenia / do produkcji

- `xlsx@0.18.5` (SheetJS z npm) ma CVE (proto pollution/ReDoS) bez fixu w rejestrze npm —
  ryzyko ograniczone (źródło rządowe po TLS + SSRF-whitelist + walidacja); produkcyjnie
  build z CDN SheetJS 0.20.x. Rejestr publikuje realnie **legacy `.xls`**, nie `.xlsx`.
- Publiczny Nominatim/OSRM/kafelki OSM tylko do developmentu — produkcyjnie self-host / płatny tier.
- CSP używa `'unsafe-inline'` (script/style) — docelowo strict CSP z nonce przez middleware.
- Multer (transitive @nestjs/platform-express) ma ostrzeżenie audytu — do śledzenia przy aktualizacji Nest.
