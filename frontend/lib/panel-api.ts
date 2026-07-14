// Klient panelu: access-token trzymany w PAMIĘCI (nie localStorage), refresh w cookie httpOnly.
// Na starcie próbujemy odświeżyć (bootstrap), a przy 401 raz automatycznie rotujemy.

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

let accessToken: string | null = null;

export interface PanelUser {
  id: string;
  email: string;
  role: string;
  pharmacyId: string | null;
}

async function refresh(): Promise<string | null> {
  const res = await fetch(`${API}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    accessToken = null;
    return null;
  }
  const j = (await res.json()) as { accessToken: string };
  accessToken = j.accessToken;
  return accessToken;
}

export async function apiFetch(path: string, opts: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(opts.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const res = await fetch(`${API}${path}`, { ...opts, headers, credentials: "include" });
  if (res.status === 401 && retry) {
    const t = await refresh();
    if (t) return apiFetch(path, opts, false);
  }
  return res;
}

export async function login(email: string, password: string): Promise<PanelUser> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? "Błąd logowania");
  }
  const j = (await res.json()) as { accessToken: string; user: PanelUser };
  accessToken = j.accessToken;
  return j.user;
}

export async function register(payload: {
  email: string;
  password: string;
  pharmacyId: string;
  evidence: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) throw new Error(j.message ?? "Błąd rejestracji");
  return { message: j.message ?? "OK" };
}

export async function logout(): Promise<void> {
  await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
  accessToken = null;
}

// Na starcie panelu: odśwież i pobierz profil (null gdy niezalogowany).
export async function bootstrapMe(): Promise<(PanelUser & { claim: ClaimInfo | null }) | null> {
  const t = await refresh();
  if (!t) return null;
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) return null;
  return res.json() as Promise<PanelUser & { claim: ClaimInfo | null }>;
}

export interface ClaimInfo {
  status: string;
  pharmacyName: string;
  pharmacySlug: string;
  reviewNote: string | null;
}
