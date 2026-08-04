"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, bootstrapMe, logout } from "@/lib/panel-api";
import { ANNOUNCEMENT_LABELS } from "@/lib/format";
import { PromoManager } from "@/components/admin/PromoManager";

interface Stats {
  pharmacies: number;
  active: number;
  geocoded: number;
  geocodingCoverage: number;
  pendingAnnouncements: number;
  pendingClaims: number;
  announcementsLast7Days: number;
}
interface Claim {
  id: string;
  status: string;
  evidence: string;
  user: { email: string };
  pharmacy: { name: string; city: string };
}
interface PendingAnn {
  id: string;
  title: string;
  body: string;
  type: string;
  pharmacy: { name: string };
}
interface SyncRun {
  id: string;
  status: string;
  startedAt: string;
  addedCount: number;
  updatedCount: number;
  deactivatedCount: number;
  geocodedCount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [anns, setAnns] = useState<PendingAnn[]>([]);
  const [runs, setRuns] = useState<SyncRun[]>([]);

  const refresh = useCallback(async () => {
    const [s, c, a, r] = await Promise.all([
      apiFetch("/api/admin/stats"),
      apiFetch("/api/admin/claims?status=PENDING"),
      apiFetch("/api/admin/announcements?status=PENDING"),
      apiFetch("/api/admin/sync-runs"),
    ]);
    if (s.ok) setStats((await s.json()) as Stats);
    if (c.ok) setClaims((await c.json()) as Claim[]);
    if (a.ok) setAnns((await a.json()) as PendingAnn[]);
    if (r.ok) setRuns((await r.json()) as SyncRun[]);
  }, []);

  useEffect(() => {
    (async () => {
      const me = await bootstrapMe();
      if (!me || me.role !== "ADMIN") {
        router.replace("/login");
        return;
      }
      await refresh();
      setReady(true);
    })().catch(() => setReady(true));
  }, [router, refresh]);

  const reviewClaim = async (id: string, action: "APPROVE" | "REJECT") => {
    await apiFetch(`/api/admin/claims/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await refresh();
  };
  const moderateAnn = async (id: string, action: "APPROVE" | "REJECT") => {
    await apiFetch(`/api/admin/announcements/${id}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await refresh();
  };
  const triggerSync = async () => {
    await apiFetch("/api/admin/sync", { method: "POST" });
    setTimeout(refresh, 2000);
  };

  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-12 text-muted">Wczytywanie panelu admina…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">Panel administratora</h1>
        <button onClick={() => logout().then(() => router.replace("/login"))} className="pressable rounded-lg border px-3 py-1.5 text-sm text-ink-soft hover:border-danger hover:text-danger">
          Wyloguj
        </button>
      </div>

      {/* Statystyki */}
      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Apteki" value={stats.pharmacies} />
          <Stat label="Aktywne" value={stats.active} />
          <Stat label="Geokodowanie" value={`${stats.geocodingCoverage}%`} sub={`${stats.geocoded} z ${stats.active}`} />
          <Stat label="Komunikaty /7 dni" value={stats.announcementsLast7Days} />
        </div>
      )}

      {/* Claimy */}
      <Section title={`Zgłoszenia aptek (${claims.length})`}>
        {claims.length === 0 ? (
          <Empty>Brak oczekujących zgłoszeń.</Empty>
        ) : (
          claims.map((c) => (
            <Row key={c.id}>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{c.user.email}</p>
                <p className="text-sm text-muted">{c.pharmacy.name}, {c.pharmacy.city} · {c.evidence}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Approve onClick={() => reviewClaim(c.id, "APPROVE")} />
                <Reject onClick={() => reviewClaim(c.id, "REJECT")} />
              </div>
            </Row>
          ))
        )}
      </Section>

      {/* Moderacja komunikatów */}
      <Section title={`Komunikaty do moderacji (${anns.length})`}>
        {anns.length === 0 ? (
          <Empty>Brak komunikatów do moderacji.</Empty>
        ) : (
          anns.map((a) => (
            <Row key={a.id}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-violet/10 px-2 py-0.5 text-xs font-semibold text-violet">{ANNOUNCEMENT_LABELS[a.type] ?? "Komunikat"}</span>
                  <span className="text-xs text-muted">{a.pharmacy.name}</span>
                </div>
                <p className="mt-1 font-semibold text-ink">{a.title}</p>
                <p className="truncate text-sm text-ink-soft">{a.body}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Approve onClick={() => moderateAnn(a.id, "APPROVE")} />
                <Reject onClick={() => moderateAnn(a.id, "REJECT")} />
              </div>
            </Row>
          ))
        )}
      </Section>

      {/* Galeria strony głównej */}
      <PromoManager />

      {/* Sync */}
      <Section
        title="Synchronizacja rejestru"
        action={<button onClick={triggerSync} className="pressable rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-surface hover:bg-teal-dark">Uruchom sync</button>}
      >
        {runs.length === 0 ? (
          <Empty>Brak przebiegów.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr><th className="py-1">Data</th><th>Status</th><th>+dod.</th><th>~zm.</th><th>-usun.</th><th>geo</th></tr>
              </thead>
              <tbody>
                {runs.slice(0, 8).map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-1.5">{new Date(r.startedAt).toLocaleString("pl-PL")}</td>
                    <td><StatusPill status={r.status} /></td>
                    <td>{r.addedCount}</td><td>{r.updatedCount}</td><td>{r.deactivatedCount}</td><td>{r.geocodedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-ink">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border p-3">{children}</div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted">{children}</p>;
}
function Approve({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="pressable rounded-lg bg-open/10 px-3 py-1.5 text-sm font-semibold text-open hover:bg-open/20">✓ Zatwierdź</button>;
}
function Reject({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="pressable rounded-lg bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger hover:bg-danger/20">× Odrzuć</button>;
}
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = { SUCCESS: "text-open", PARTIAL: "text-warn", FAILED: "text-danger", RUNNING: "text-teal" };
  return <span className={`font-semibold ${map[status] ?? "text-muted"}`}>{status}</span>;
}
