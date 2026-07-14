"use client";

import { useState } from "react";
import Link from "next/link";
import { register } from "@/lib/panel-api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Rozwiąż slug apteki (z adresu /apteka/<slug>) na jej identyfikator.
      const res = await fetch(`${API}/api/pharmacies/${encodeURIComponent(slug.trim())}`);
      if (!res.ok) throw new Error("Nie znaleziono apteki o podanym adresie (slug).");
      const pharmacy = (await res.json()) as { id: string; name: string };
      const r = await register({ email, password, pharmacyId: pharmacy.id, evidence });
      setDone(r.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
          <div className="text-4xl">📨</div>
          <h1 className="mt-3 text-xl font-bold text-ink">Zgłoszenie przyjęte</h1>
          <p className="mt-2 text-ink-soft">{done}</p>
          <Link href="/login" className="pressable mt-5 inline-block rounded-xl bg-teal px-5 py-2.5 font-semibold text-surface">
            Przejdź do logowania
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h1 className="text-2xl font-extrabold text-ink">Zgłoś swoją aptekę</h1>
        <p className="mt-1 text-sm text-muted">
          Konto uzyska dostęp do panelu po weryfikacji przez administratora.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="E-mail" type="email" value={email} onChange={setEmail} />
          <Field label="Hasło (min. 8 znaków)" type="password" value={password} onChange={setPassword} />
          <Field
            label="Adres apteki (slug z otoapteka.pl/apteka/…)"
            value={slug}
            onChange={setSlug}
            placeholder="np. ziko-warszawa-42"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Uzasadnienie / nr zezwolenia</label>
            <textarea
              required
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={3}
              className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-teal"
            />
          </div>
          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="pressable w-full rounded-xl bg-teal px-4 py-3 font-bold text-surface hover:bg-teal-dark disabled:opacity-60"
          >
            {loading ? "Wysyłanie…" : "Wyślij zgłoszenie"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink-soft">{label}</label>
      <input
        type={type}
        required
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-teal"
      />
    </div>
  );
}
