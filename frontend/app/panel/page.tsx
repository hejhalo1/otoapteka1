"use client";

import { useCallback, useEffect, useState } from "react";
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

      {/* Brak zatwierdzonej apteki */}
      {!user?.pharmacyId ? (
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

function ProfileForm({ pharmacy, onSaved }: { pharmacy: PanelPharmacy; onSaved: () => void }) {
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
    const res = await apiFetch("/api/panel/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, email: email || undefined, phoneExtra: phoneExtra || undefined, prescriptionPickup }),
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

function Announcements({ pharmacy, onChange }: { pharmacy: PanelPharmacy; onChange: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("PRODUCT_INFO");
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await apiFetch("/api/panel/announcements", {
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
    const res = await apiFetch(`/api/panel/announcements/${id}`, { method: "DELETE" });
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
            Dodaj (do moderacji)
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
