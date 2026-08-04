"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Trash2, Upload } from "lucide-react";
import { apiFetch } from "@/lib/panel-api";
import { assetUrl } from "@/lib/api";

interface Slide {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  href: string | null;
  sortOrder: number;
  active: boolean;
}

/** Zarządzanie galerią promocyjną strony głównej (upload, aktywacja, usuwanie). */
export function PromoManager() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [href, setHref] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await apiFetch("/api/admin/promo-slides");
    if (res.ok) setSlides((await res.json()) as Slide[]);
  }, []);

  useEffect(() => {
    // refresh() ustawia stan dopiero po await (asynchronicznie) — false-positive reguły.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Wybierz plik obrazu.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      if (subtitle.trim()) fd.append("subtitle", subtitle.trim());
      if (href.trim()) fd.append("href", href.trim());
      const res = await apiFetch("/api/admin/promo-slides", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        setError(j.message ?? "Nie udało się dodać slajdu.");
        return;
      }
      setTitle("");
      setSubtitle("");
      setHref("");
      if (fileRef.current) fileRef.current.value = "";
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (s: Slide) => {
    await apiFetch(`/api/admin/promo-slides/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    await refresh();
  };

  const remove = async (id: string) => {
    await apiFetch(`/api/admin/promo-slides/${id}`, { method: "DELETE" });
    await refresh();
  };

  return (
    <section className="mt-5 rounded-2xl border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-3 text-lg font-bold text-ink">Galeria strony głównej ({slides.length})</h2>

      {/* Formularz dodawania */}
      <form onSubmit={upload} className="mb-4 grid gap-2 rounded-xl border bg-bg p-3 sm:grid-cols-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-label="Plik obrazu"
          className="text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-pharma file:px-3 file:py-1.5 file:font-semibold file:text-white"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tytuł (opcjonalnie)"
          className="rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:border-pharma"
        />
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Podpis (opcjonalnie)"
          className="rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:border-pharma"
        />
        <input
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="Link wewnętrzny, np. /mapa (opcjonalnie)"
          className="rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:border-pharma"
        />
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="pressable inline-flex items-center gap-2 rounded-lg bg-pharma px-4 py-2 text-sm font-bold text-white hover:bg-pharma-dark disabled:opacity-60"
          >
            <Upload className="h-4 w-4" aria-hidden />
            {busy ? "Wysyłanie…" : "Dodaj slajd"}
          </button>
          {error && <span className="ml-3 text-sm font-medium text-danger">{error}</span>}
        </div>
      </form>

      {/* Lista slajdów */}
      {slides.length === 0 ? (
        <p className="text-muted">Brak slajdów — na stronie głównej pokazują się domyślne ilustracje.</p>
      ) : (
        <div className="grid gap-2">
          {slides.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura admina */}
              <img
                src={assetUrl(s.imageUrl)}
                alt=""
                className="h-14 w-20 shrink-0 rounded-lg border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{s.title || "(bez tytułu)"}</p>
                <p className="truncate text-sm text-muted">
                  {s.subtitle || "—"} {s.href && <span className="text-pharma-dark">· {s.href}</span>}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                  s.active ? "bg-pharma-soft text-pharma-dark" : "bg-bg text-muted"
                }`}
              >
                {s.active ? "aktywny" : "ukryty"}
              </span>
              <button
                onClick={() => toggle(s)}
                title={s.active ? "Ukryj" : "Pokaż"}
                className="pressable grid h-8 w-8 place-items-center rounded-lg border text-ink-soft hover:border-pharma hover:text-pharma"
              >
                {s.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => remove(s.id)}
                title="Usuń"
                className="pressable grid h-8 w-8 place-items-center rounded-lg border text-ink-soft hover:border-danger hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
