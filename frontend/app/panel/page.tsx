"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, bootstrapMe, logout, type ClaimInfo, type PanelUser } from "@/lib/panel-api";
import { ANNOUNCEMENT_LABELS } from "@/lib/format";

interface PanelPharmacy {
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
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekuje na moderację",
  PUBLISHED: "Opublikowany",
  REJECTED: "Odrzucony",
  DRAFT: "Szkic",
  ARCHIVED: "Zarchiwizowany",
};

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
    return <div className="mx-auto max-w-3xl px-4 py-12 text-muted">Wczytywanie panelu…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">Panel apteki</h1>
        <button onClick={doLogout} className="pressable rounded-lg border px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-danger hover:text-danger">
          Wyloguj
        </button>
      </div>

      {/* Admin: zarządza panelem dowolnej apteki */}
      {user?.role === "ADMIN" ? (
        <AdminPharmacyManager />
      ) : !user?.pharmacyId ? (
        <div className="mt-6 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-bold text-ink">Status zgłoszenia</h2>
          {user?.claim ? (
            <div className="mt-2 text-ink-soft">
              <p>Apteka: <span className="font-semibold text-ink">{user.claim.pharmacyName}</span></p>
              <p className="mt-1">
                Status:{" "}
                <span className="font-semibold">
                  {user.claim.status === "PENDING" && "⏳ Oczekuje na zatwierdzenie"}
                  {user.claim.status === "APPROVED" && "✓ Zatwierdzone"}
                  {user.claim.status === "REJECTED" && "× Odrzucone"}
                </span>
              </p>
              {user.claim.reviewNote && <p className="mt-1 text-sm text-muted">Uwaga: {user.claim.reviewNote}</p>}
            </div>
          ) : (
            <p className="mt-2 text-ink-soft">Brak zgłoszenia. Zgłoś aptekę, aby uzyskać dostęp.</p>
          )}
        </div>
      ) : pharmacy ? (
        <>
          <p className="mt-2 text-ink-soft">
            {pharmacy.name} · {pharmacy.street}, {pharmacy.city} ·{" "}
            <Link href={`/apteka/${pharmacy.slug}`} className="text-teal underline">
              zobacz wizytówkę
            </Link>
          </p>
          <ProfileForm pharmacy={pharmacy} onSaved={loadPharmacy} />
          <Announcements pharmacy={pharmacy} onChange={loadPharmacy} />
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
  const [msg, setMsg] = useState<string | null>(null);
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
    setMsg(res.ok ? "Zapisano." : "Błąd zapisu.");
    setSaving(false);
    if (res.ok) onSaved();
  };

  return (
    <section className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-lg font-bold text-ink">Profil apteki</h2>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Opis</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-teal" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">E-mail kontaktowy</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-teal" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Telefon dodatkowy</label>
            <input value={phoneExtra} onChange={(e) => setPhoneExtra(e.target.value)} className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-teal" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={prescriptionPickup} onChange={(e) => setPrescriptionPickup(e.target.checked)} className="h-4 w-4 accent-teal" />
          Odbiór recept
        </label>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="pressable rounded-xl bg-teal px-5 py-2.5 font-semibold text-surface hover:bg-teal-dark disabled:opacity-60">
            {saving ? "Zapisywanie…" : "Zapisz profil"}
          </button>
          {msg && <span className="text-sm text-muted">{msg}</span>}
        </div>
      </form>
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
    <section className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-lg font-bold text-ink">Info z apteki (komunikaty)</h2>

      <form onSubmit={create} className="mb-6 space-y-3 rounded-xl bg-bg p-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tytuł" required minLength={3} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-teal" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Treść" required minLength={3} rows={2} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-teal" />
        <div className="flex flex-wrap items-center gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border px-3 py-2 outline-none focus:border-teal">
            {Object.entries(ANNOUNCEMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button type="submit" disabled={busy} className="pressable rounded-lg bg-teal px-4 py-2 font-semibold text-surface hover:bg-teal-dark disabled:opacity-60">
            {immediate ? "Dodaj i opublikuj" : "Dodaj (do moderacji)"}
          </button>
        </div>
      </form>

      {pharmacy.announcements.length === 0 ? (
        <p className="text-muted">Brak komunikatów.</p>
      ) : (
        <ul className="space-y-2">
          {pharmacy.announcements.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-violet/10 px-2 py-0.5 text-xs font-semibold text-violet">{ANNOUNCEMENT_LABELS[a.type] ?? "Komunikat"}</span>
                  <span className="text-xs font-medium text-muted">{STATUS_LABELS[a.status] ?? a.status}</span>
                </div>
                <p className="mt-1 font-semibold text-ink">{a.title}</p>
                <p className="truncate text-sm text-ink-soft">{a.body}</p>
              </div>
              <button onClick={() => remove(a.id)} className="pressable shrink-0 rounded-lg px-2 py-1 text-sm text-danger hover:bg-danger/10">
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---- Panel administratora: zarządzanie panelem DOWOLNEJ apteki ----

interface AdminSearchItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  street: string;
}

type AdminPharmacyData = PanelPharmacy & {
  id?: string;
  dutyShifts?: { id: string; startsAt: string; endsAt: string; note: string | null }[];
};

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

function AdminPharmacyManager() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AdminSearchItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<AdminPharmacyData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (query: string) => {
    const res = await apiFetch(`/api/admin/pharmacies?q=${encodeURIComponent(query)}`);
    if (res.ok) setResults((await res.json()) as AdminSearchItem[]);
  }, []);

  const loadPharmacy = useCallback(async (id: string) => {
    const res = await apiFetch(`/api/admin/pharmacies/${id}`);
    if (res.ok) setData((await res.json()) as AdminPharmacyData);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void search("");
  }, [search]);

  const onQ = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void search(v), 250);
  };

  const pick = async (id: string) => {
    setSelectedId(id);
    setData(null);
    await loadPharmacy(id);
  };

  const reload = useCallback(() => {
    if (selectedId) void loadPharmacy(selectedId);
  }, [selectedId, loadPharmacy]);

  const base = selectedId ? `/api/admin/pharmacies/${selectedId}` : "";
  const selected = results.find((r) => r.id === selectedId);

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-violet/30 bg-violet/5 p-4">
        <p className="text-sm font-semibold text-violet">
          Tryb administratora — możesz edytować panel każdej apteki (profil, kafelki-flagi,
          dyżury, komunikaty). Komunikaty dodane tutaj publikują się od razu.
        </p>
      </div>

      {/* Wyszukiwarka aptek */}
      <section className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-3 text-lg font-bold text-ink">Wybierz aptekę</h2>
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Szukaj po nazwie, mieście lub ulicy…"
          className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-teal"
        />
        <ul className="mt-3 max-h-72 space-y-1 overflow-auto">
          {results.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => void pick(r.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  r.id === selectedId
                    ? "border-teal bg-teal/10 font-semibold text-ink"
                    : "border-line hover:border-teal hover:bg-bg text-ink-soft"
                }`}
              >
                <span className="font-semibold text-ink">{r.name}</span>
                <span className="text-muted"> — {r.street}, {r.city}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-1 py-2 text-sm text-muted">Brak wyników.</li>
          )}
        </ul>
      </section>

      {/* Edycja wybranej apteki */}
      {selectedId && data ? (
        <>
          <p className="mt-6 text-ink-soft">
            Edytujesz:{" "}
            <span className="font-semibold text-ink">{selected?.name ?? data.name}</span>
            {" · "}
            <Link href={`/apteka/${data.slug}`} className="text-teal underline">
              zobacz wizytówkę
            </Link>
          </p>
          <ProfileForm key={`p-${selectedId}`} base={base} pharmacy={data} onSaved={reload} />
          <DutyManager
            key={`d-${selectedId}`}
            base={base}
            duties={data.dutyShifts ?? []}
            onChange={reload}
          />
          <Announcements
            key={`a-${selectedId}`}
            base={base}
            immediate
            pharmacy={data}
            onChange={reload}
          />
        </>
      ) : selectedId ? (
        <p className="mt-6 text-muted">Wczytywanie apteki…</p>
      ) : null}
    </div>
  );
}

function DutyManager({
  base,
  duties,
  onChange,
}: {
  base: string;
  duties: { id: string; startsAt: string; endsAt: string; note: string | null }[];
  onChange: () => void;
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
      setMsg("Błąd zapisu (koniec dyżuru musi być po początku).");
    }
  };

  const remove = async (id: string) => {
    const res = await apiFetch(`${base}/duty/${id}`, { method: "DELETE" });
    if (res.ok) onChange();
  };

  return (
    <section className="mt-4 rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-1 text-lg font-bold text-ink">Dyżury</h2>
      <p className="mb-4 text-sm text-muted">
        Zasilają pomarańczową sekcję „Dyżur” na karcie apteki.
      </p>

      <form onSubmit={add} className="mb-6 space-y-3 rounded-xl bg-bg p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Początek</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Koniec</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-teal"
            />
          </div>
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notatka (opcjonalnie)"
          className="w-full rounded-lg border px-3 py-2 outline-none focus:border-teal"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="pressable rounded-lg bg-teal px-4 py-2 font-semibold text-surface hover:bg-teal-dark disabled:opacity-60"
          >
            Dodaj dyżur
          </button>
          {msg && <span className="text-sm text-danger">{msg}</span>}
        </div>
      </form>

      {duties.length === 0 ? (
        <p className="text-muted">Brak dyżurów.</p>
      ) : (
        <ul className="space-y-2">
          {duties.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-xl border p-3"
            >
              <div className="min-w-0">
                <p className="font-semibold tabular-nums text-ink">
                  {fmtDuty(d.startsAt, d.endsAt)}
                </p>
                {d.note && <p className="truncate text-sm text-ink-soft">{d.note}</p>}
              </div>
              <button
                onClick={() => remove(d.id)}
                className="pressable shrink-0 rounded-lg px-2 py-1 text-sm text-danger hover:bg-danger/10"
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
