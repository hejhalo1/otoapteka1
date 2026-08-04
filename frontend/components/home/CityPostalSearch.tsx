"use client";

import { useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { geocodePlace } from "@/lib/api";
import type { Coords } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * Wyszukiwanie po mieście (+ opcjonalny kod pocztowy). Geokoduje przez backend
 * (GUGiK) i podnosi wynik do rodzica jako punkt odniesienia listy.
 */
export function CityPostalSearch({ onResolved }: { onResolved: (c: Coords) => void }) {
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = city.trim();
    if (c.length < 2) {
      setError("Podaj nazwę miejscowości.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const hit = await geocodePlace(c, postal.trim() || undefined);
      if (!hit) {
        setError("Nie znaleziono takiej miejscowości. Sprawdź pisownię.");
        return;
      }
      onResolved({ lat: hit.lat, lng: hit.lng, label: hit.label });
    } catch {
      setError("Nie udało się wyszukać. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Wpisz miasto, np. Kraków"
            aria-label="Miasto"
            autoComplete="address-level2"
            className="w-full rounded-2xl border bg-surface py-3 pl-10 pr-3 font-medium text-ink shadow-[var(--shadow-card)] outline-none transition-colors placeholder:text-muted/80 focus:border-pharma"
          />
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={postal}
          onChange={(e) => {
            // Autoformat NN-NNN.
            const digits = e.target.value.replace(/\D/g, "").slice(0, 5);
            setPostal(digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits);
          }}
          placeholder="Kod (opcjonalnie)"
          aria-label="Kod pocztowy"
          autoComplete="postal-code"
          className="w-full rounded-2xl border bg-surface px-3 py-3 font-medium text-ink shadow-[var(--shadow-card)] outline-none transition-colors placeholder:text-muted/80 focus:border-pharma sm:w-40"
        />
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "pressable inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-line bg-surface px-5 py-3 font-bold text-ink transition-colors hover:border-pharma hover:text-pharma disabled:opacity-60",
          )}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Search className="h-5 w-5" aria-hidden />
          )}
          <span className="sm:hidden lg:inline">Szukaj</span>
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
