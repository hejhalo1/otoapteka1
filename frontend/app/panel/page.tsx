"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
  LogOut,
  Megaphone,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { apiFetch, bootstrapMe, logout, type ClaimInfo, type PanelUser } from "@/lib/panel-api";
import { ANNOUNCEMENT_LABELS } from "@/lib/format";
import type { City } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PanelPharmacy {
  id?: string;
  name: string;
  slug: string;
  street: string;
  city: string;
  profile: {
    description: string | null;
    email: string | null;
    phoneExtra: string | null;
    prescriptionPickup: boolean;
  } | null;
  announcements: { id: string; title: string; body: string; type: string; status: string }[];
  dutyShifts?: { id: string; startsAt: string; endsAt: string; note: string | null }[];
}

// Wspólne style — spójne z resztą serwisu (paleta pharma, kwadratowe rogi).
const CARD = "rounded-lg border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6";
const INPUT =
  "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-ink outline-none transition-colors placeholder:text-muted focus:border-pharma focus:ring-2 focus:ring-pharma/15";
const LABEL = "mb-1.5 block text-sm font-semibold text-ink-soft";
const BTN =
  "pressable inline-flex items-center justify-center gap-2 rounded-md bg-pharma px-5 py-2.5 font-bold text-white transition-colors hover:bg-pharma-dark disabled:opacity-60";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekuje na moderację",
  PUBLISHED: "Opublikowany",
  REJECTED: "Odrzucony",
  DRAFT: "Szkic",
  ARCHIVED: "Zarchiwizowany",
};
const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-warn/10 text-warn",
  PUBLISHED: "bg-open/10 text-open",
  REJECTED: "bg-danger/10 text-danger",
  DRAFT: "bg-muted/10 text-muted",
  ARCHIVED: "bg-muted/10 text-muted",
};

function SectionHead({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-pharma-soft text-pharma-dark">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h2 className="text-lg font-black tracking-tight text-ink">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
      </div>
    </div>
  );
}

export default function PanelPage() {
  const router = useRouter();
  const [user, setUser] = useState<(PanelUser & { claim: ClaimInfo | null }) | null>(null);
  const [pharmacy, setPharmacy] = useState<PanelPharmacy | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPharmacy = useCallback(async () => {
    const res = await apiFetch("/api/panel/pharmacy");
    if (res.ok) setPharmacy((await res.json()) as PanelPharmacy);
  }, []);

  useEffect(() => {
    (async () => {
      const me = await bootstrapMe();
      if (!me) {
        router.replace("/login");
        return;
      }
      setUser(me);
      if (me.pharmacyId) await loadPharmacy();
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [router, loadPharmacy]);

  const doLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton mt-6 h-40 w-full rounded-lg" />
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Nagłówek panelu */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-pharma text-white">
            <Building2 className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-ink">Panel apteki</h1>
            <p className="text-sm text-muted">
              {isAdmin ? "Zalogowano jako administrator" : "Zarządzaj profilem swojej apteki"}
            </p>
          </div>
        </div>
        <button
          onClick={doLogout}
          className="pressable inline-flex items-center gap-2 rounded-md border border-line px-3.5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-danger hover:text-danger"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Wyloguj
        </button>
      </div>

      {isAdmin ? (
        <AdminPharmacyManager />
      ) : !user?.pharmacyId ? (
        <div className={cn(CARD, "mt-6")}>
          <SectionHead icon={ShieldCheck} title="Status zgłoszenia" />
          {user?.claim ? (
            <div className="text-ink-soft">
              <p>
                Apteka: <span className="font-semibold text-ink">{user.claim.pharmacyName}</span>
              </p>
              <p className="mt-1.5">
                Status:{" "}
                <span className="font-semibold text-ink">
                  {user.claim.status === "PENDING" && "Oczekuje na zatwierdzenie"}
                  {user.claim.status === "APPROVED" && "Zatwierdzone"}
                  {user.claim.status === "REJECTED" && "Odrzucone"}
                </span>
              </p>
              {user.claim.reviewNote && (
                <p className="mt-1 text-sm text-muted">Uwaga: {user.claim.reviewNote}</p>
              )}
            </div>
          ) : (
            <p className="text-ink-soft">Brak zgłoszenia. Zgłoś aptekę, aby uzyskać dostęp do panelu.</p>
          )}
        </div>
      ) : pharmacy ? (
        <>
          {/* Karta apteki */}
          <div className={cn(CARD, "mt-6 flex flex-wrap items-center justify-between gap-3")}>
            <div>
              <p className="text-lg font-black text-ink">{pharmacy.name}</p>
              <p className="text-sm text-ink-soft">
                {pharmacy.street}, {pharmacy.city}
              </p>
            </div>
            <Link
              href={`/apteka/${pharmacy.slug}`}
              className="pressable inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-pharma hover:text-pharma"
            >
              <ExternalLink className="h-4 w-4" aria-hidden /> Zobacz wizytówkę
            </Link>
          </div>

          <div className="mt-6 space-y-6">
            <ProfileForm pharmacy={pharmacy} onSaved={loadPharmacy} />
            <DutyManager duties={pharmacy.dutyShifts ?? []} onChange={loadPharmacy} />
            <Announcements pharmacy={pharmacy} onChange={loadPharmacy} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function ProfileForm({
  pharmacy,
  onSaved,
  base = "/api/panel",
}: {
  pharmacy: PanelPharmacy;
  onSaved: () => void;
  base?: string;
}) {
  const p = pharmacy.profile;
  const [description, setDescription] = useState(p?.description ?? "");
  const [email, setEmail] = useState(p?.email ?? "");
  const [phoneExtra, setPhoneExtra] = useState(p?.phoneExtra ?? "");
  const [prescriptionPickup, setPrescriptionPickup] = useState(p?.prescriptionPickup ?? false);
  const [msg, setMsg] = useState<"ok" | "err" | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await apiFetch(`${base}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        email: email || undefined,
        phoneExtra: phoneExtra || undefined,
        prescriptionPickup,
      }),
    });
    setMsg(res.ok ? "ok" : "err");
    setSaving(false);
    if (res.ok) onSaved();
  };

  return (
    <section className={CARD}>
      <SectionHead icon={Building2} title="Profil apteki" desc="Opis i dane kontaktowe widoczne na wizytówce." />
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className={LABEL}>Opis apteki</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Krótko o aptece, specjalizacji, udogodnieniach…"
            className={INPUT}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL}>E-mail kontaktowy</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Telefon dodatkowy</label>
            <input value={phoneExtra} onChange={(e) => setPhoneExtra(e.target.value)} className={INPUT} />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={prescriptionPickup}
            onChange={(e) => setPrescriptionPickup(e.target.checked)}
            className="h-4 w-4 accent-pharma"
          />
          Odbiór recept
        </label>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving} className={BTN}>
            {saving ? "Zapisywanie…" : "Zapisz profil"}
          </button>
          {msg === "ok" && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-open">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Zapisano
            </span>
          )}
          {msg === "err" && <span className="text-sm font-semibold text-danger">Błąd zapisu.</span>}
        </div>
      </form>
    </section>
  );
}

function fmtDuty(startsAt: string, endsAt: string): string {
  const f = (d: string) =>
    new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Warsaw",
    }).format(new Date(d));
  return `${f(startsAt)} → ${f(endsAt)}`;
}

function DutyManager({
  duties,
  onChange,
  base = "/api/panel",
}: {
  duties: { id: string; startsAt: string; endsAt: string; note: string | null }[];
  onChange: () => void;
  base?: string;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) return;
    setBusy(true);
    setMsg(null);
    const res = await apiFetch(`${base}/duty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(end).toISOString(),
        note: note || undefined,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setStart("");
      setEnd("");
      setNote("");
      onChange();
    } else {
      setMsg("Nie udało się zapisać. Koniec dyżuru musi być po jego początku.");
    }
  };

  const remove = async (id: string) => {
    const res = await apiFetch(`${base}/duty/${id}`, { method: "DELETE" });
    if (res.ok) onChange();
  };

  return (
    <section className={CARD}>
      <SectionHead icon={Moon} title="Dyżury" desc="Widoczne na wizytówce apteki jako dyżury nocne i świąteczne." />

      <form onSubmit={add} className="mb-5 space-y-3 rounded-md border border-line bg-bg p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Początek</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Koniec</label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required className={INPUT} />
          </div>
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notatka (opcjonalnie)" className={INPUT} />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className={BTN}>
            <Plus className="h-4 w-4" aria-hidden /> Dodaj dyżur
          </button>
          {msg && <span className="text-sm font-semibold text-danger">{msg}</span>}
        </div>
      </form>

      {duties.length === 0 ? (
        <p className="text-sm text-muted">Brak zaplanowanych dyżurów.</p>
      ) : (
        <ul className="space-y-2">
          {duties.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
              <div className="min-w-0">
                <p className="font-bold tabular-nums text-ink">{fmtDuty(d.startsAt, d.endsAt)}</p>
                {d.note && <p className="truncate text-sm text-ink-soft">{d.note}</p>}
              </div>
              <button
                onClick={() => remove(d.id)}
                className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Usuń
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Announcements({
  pharmacy,
  onChange,
  base = "/api/panel",
  immediate = false,
}: {
  pharmacy: PanelPharmacy;
  onChange: () => void;
  base?: string;
  immediate?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("PRODUCT_INFO");
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await apiFetch(`${base}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, type }),
    });
    setBusy(false);
    if (res.ok) {
      setTitle("");
      setBody("");
      onChange();
    }
  };

  const remove = async (id: string) => {
    const res = await apiFetch(`${base}/announcements/${id}`, { method: "DELETE" });
    if (res.ok) onChange();
  };

  return (
    <section className={CARD}>
      <SectionHead
        icon={Megaphone}
        title="Komunikaty"
        desc={immediate ? "Publikują się od razu (tryb administratora)." : "Po dodaniu trafiają do moderacji."}
      />

      <form onSubmit={create} className="mb-5 space-y-3 rounded-md border border-line bg-bg p-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tytuł komunikatu" required minLength={3} className={INPUT} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Treść" required minLength={3} rows={2} className={INPUT} />
        <div className="flex flex-wrap items-center gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className={cn(INPUT, "sm:w-auto")}>
            {Object.entries(ANNOUNCEMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy} className={BTN}>
            <Plus className="h-4 w-4" aria-hidden /> {immediate ? "Dodaj i opublikuj" : "Dodaj komunikat"}
          </button>
        </div>
      </form>

      {pharmacy.announcements.length === 0 ? (
        <p className="text-sm text-muted">Brak komunikatów.</p>
      ) : (
        <ul className="space-y-2">
          {pharmacy.announcements.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-line p-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-pharma-soft px-2 py-0.5 text-xs font-bold text-pharma-dark">
                    {ANNOUNCEMENT_LABELS[a.type] ?? "Komunikat"}
                  </span>
                  <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", STATUS_BADGE[a.status] ?? "bg-muted/10 text-muted")}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                </div>
                <p className="mt-1.5 font-bold text-ink">{a.title}</p>
                <p className="truncate text-sm text-ink-soft">{a.body}</p>
              </div>
              <button
                onClick={() => remove(a.id)}
                className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Usuń
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ───────────── Panel administratora: wybór + edycja dowolnej apteki ─────────────

interface AdminSearchItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  street: string;
  voivodeship: string;
}

type AdminPharmacyData = PanelPharmacy & {
  id?: string;
  dutyShifts?: { id: string; startsAt: string; endsAt: string; note: string | null }[];
};

function AdminPharmacyManager() {
  const [cities, setCities] = useState<City[]>([]);
  const [q, setQ] = useState("");
  const [wojSlug, setWojSlug] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<{ voivodeship: string; city: string } | null>(null);
  const [results, setResults] = useState<AdminSearchItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<AdminPharmacyData | null>(null);

  // Katalog miast (publiczny) — do drill-downu województwo → miasto.
  useEffect(() => {
    (async () => {
      const res = await apiFetch("/api/pharmacies/cities");
      if (res.ok) setCities((await res.json()) as City[]);
    })().catch(() => {});
  }, []);

  const fetchPh = useCallback(async (params: Record<string, string>) => {
    setBusy(true);
    const res = await apiFetch(`/api/admin/pharmacies?${new URLSearchParams(params).toString()}`);
    if (res.ok) setResults((await res.json()) as AdminSearchItem[]);
    setBusy(false);
  }, []);

  const query = q.trim();
  const searchMode = query.length >= 2;

  // Apteki: tryb wyszukiwania (q, z debounce) albo lista wybranego miasta. Cała
  // aktualizacja stanu w callbacku timera — nie synchronicznie w ciele efektu.
  useEffect(() => {
    const t = setTimeout(
      () => {
        if (searchMode) void fetchPh({ q: query });
        else if (selectedCity)
          void fetchPh({ voivodeship: selectedCity.voivodeship, city: selectedCity.city });
        else setResults([]);
      },
      searchMode ? 250 : 0,
    );
    return () => clearTimeout(t);
  }, [searchMode, query, selectedCity, fetchPh]);

  const loadPharmacy = useCallback(async (id: string) => {
    const res = await apiFetch(`/api/admin/pharmacies/${id}`);
    if (res.ok) setData((await res.json()) as AdminPharmacyData);
  }, []);

  const pick = async (id: string) => {
    setSelectedId(id);
    setData(null);
    await loadPharmacy(id);
  };
  const reload = useCallback(() => {
    if (selectedId) void loadPharmacy(selectedId);
  }, [selectedId, loadPharmacy]);

  // Województwa z katalogu (nazwa + liczba miast i aptek).
  const voivodeships = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; cities: number; pharmacies: number }>();
    for (const c of cities) {
      const e = map.get(c.voivodeshipSlug) ?? {
        slug: c.voivodeshipSlug,
        name: c.voivodeship,
        cities: 0,
        pharmacies: 0,
      };
      e.cities += 1;
      e.pharmacies += c.count;
      map.set(c.voivodeshipSlug, e);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }, [cities]);

  const wojName = voivodeships.find((v) => v.slug === wojSlug)?.name ?? null;
  const citiesInWoj = useMemo(
    () =>
      cities
        .filter((c) => c.voivodeshipSlug === wojSlug)
        .sort((a, b) => a.city.localeCompare(b.city, "pl")),
    [cities, wojSlug],
  );

  const base = selectedId ? `/api/admin/pharmacies/${selectedId}` : "";
  const selectedName = results.find((r) => r.id === selectedId)?.name;

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-md border border-pharma/25 bg-pharma-soft px-4 py-3 text-sm font-semibold text-pharma-dark">
        Tryb administratora. Wybierz aptekę, aby edytować jej profil, dyżury i komunikaty. Komunikaty
        dodane tutaj publikują się od razu.
      </div>

      {/* Wybór apteki: województwo → miasto → apteka, albo wyszukiwanie bezpośrednie */}
      <section className={CARD}>
        <SectionHead
          icon={Search}
          title="Wybierz aptekę"
          desc="Klikaj: województwo, potem miasto, potem apteka. Albo wyszukaj bezpośrednio."
        />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj apteki, miasta lub ulicy…"
            className={cn(INPUT, "pl-10")}
          />
        </div>

        {/* Ścieżka (poza trybem wyszukiwania) */}
        {!searchMode && (
          <nav className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
            <Crumb
              active={!wojSlug}
              onClick={() => {
                setWojSlug(null);
                setSelectedCity(null);
              }}
            >
              Województwa
            </Crumb>
            {wojName && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden />
                <Crumb active={!selectedCity} onClick={() => setSelectedCity(null)}>
                  <span className="capitalize">{wojName}</span>
                </Crumb>
              </>
            )}
            {selectedCity && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden />
                <span className="font-semibold text-ink">{selectedCity.city}</span>
              </>
            )}
          </nav>
        )}

        <div className="mt-4 max-h-[28rem] overflow-auto pr-1">
          {searchMode ? (
            <ResultList results={results} busy={busy} selectedId={selectedId} onPick={pick} showCity />
          ) : !wojSlug ? (
            cities.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted">Wczytywanie katalogu…</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {voivodeships.map((w) => (
                  <button
                    key={w.slug}
                    onClick={() => {
                      setWojSlug(w.slug);
                      setSelectedCity(null);
                    }}
                    className="pressable flex items-center justify-between gap-2 rounded-md border border-line px-3.5 py-3 text-left transition-colors hover:border-pharma hover:bg-bg"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold capitalize text-ink">{w.name}</span>
                      <span className="text-xs text-muted">
                        {w.cities} miast · {w.pharmacies} aptek
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                  </button>
                ))}
              </div>
            )
          ) : !selectedCity ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {citiesInWoj.map((c) => (
                <button
                  key={c.citySlug}
                  onClick={() => setSelectedCity({ voivodeship: c.voivodeship, city: c.city })}
                  className="pressable flex items-center justify-between gap-2 rounded-md border border-line px-3.5 py-2.5 text-left transition-colors hover:border-pharma hover:bg-bg"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink">{c.city}</span>
                    <span className="text-xs text-muted">{c.count} aptek</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                </button>
              ))}
            </div>
          ) : (
            <ResultList results={results} busy={busy} selectedId={selectedId} onPick={pick} />
          )}
        </div>
      </section>

      {/* Edytor wybranej apteki */}
      {selectedId && data ? (
        <>
          <div className={cn(CARD, "flex flex-wrap items-center justify-between gap-3")}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Edytujesz</p>
              <p className="text-lg font-black text-ink">{selectedName ?? data.name}</p>
            </div>
            <Link
              href={`/apteka/${data.slug}`}
              className="pressable inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-pharma hover:text-pharma"
            >
              <ExternalLink className="h-4 w-4" aria-hidden /> Zobacz wizytówkę
            </Link>
          </div>

          <ProfileForm key={`p-${selectedId}`} base={base} pharmacy={data} onSaved={reload} />
          <DutyManager key={`d-${selectedId}`} base={base} duties={data.dutyShifts ?? []} onChange={reload} />
          <Announcements key={`a-${selectedId}`} base={base} immediate pharmacy={data} onChange={reload} />
        </>
      ) : selectedId ? (
        <p className="text-sm text-muted">Wczytywanie apteki…</p>
      ) : null}
    </div>
  );
}

function Crumb({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pressable rounded font-semibold transition-colors",
        active ? "text-ink" : "text-pharma hover:underline",
      )}
    >
      {children}
    </button>
  );
}

function ResultList({
  results,
  busy,
  selectedId,
  onPick,
  showCity = false,
}: {
  results: AdminSearchItem[];
  busy: boolean;
  selectedId: string | null;
  onPick: (id: string) => void;
  showCity?: boolean;
}) {
  if (busy && results.length === 0) {
    return <p className="px-1 py-2 text-sm text-muted">Wczytywanie…</p>;
  }
  if (results.length === 0) {
    return <p className="px-1 py-2 text-sm text-muted">Brak aptek. Zmień miasto lub zapytanie.</p>;
  }
  return (
    <ul className="space-y-1">
      {results.map((r) => (
        <li key={r.id}>
          <button
            onClick={() => void onPick(r.id)}
            className={cn(
              "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
              r.id === selectedId ? "border-pharma bg-pharma-soft" : "border-line hover:border-pharma hover:bg-bg",
            )}
          >
            <span className="font-bold text-ink">{r.name}</span>
            <span className="text-muted">
              {" "}
              · {r.street}
              {showCity ? `, ${r.city}` : ""}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
