"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Ulubione apteki — wyłącznie localStorage (zero backendu, zero śledzenia).
 * Zmiany propagowane customowym eventem (ta karta) + storage (inne karty).
 */
const KEY = "otoapteka:favorites";
const EVENT = "otoapteka:favorites-changed";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(slugs));
  window.dispatchEvent(new Event(EVENT));
}

export function toggleFavorite(slug: string): boolean {
  const cur = read();
  const has = cur.includes(slug);
  write(has ? cur.filter((s) => s !== slug) : [...cur, slug]);
  return !has;
}

/* Cache snapshotu — useSyncExternalStore wymaga referencyjnej stabilności. */
let snapshot: string[] = [];
let snapshotJson = "";
function getSnapshot(): string[] {
  const cur = read();
  const json = JSON.stringify(cur);
  if (json !== snapshotJson) {
    snapshotJson = json;
    snapshot = cur;
  }
  return snapshot;
}
const emptySnapshot: string[] = [];

function subscribe(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Lista slugów ulubionych aptek (reaktywna). */
export function useFavorites(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => emptySnapshot);
}

/** Stan + przełącznik dla jednej apteki. */
export function useFavorite(slug: string): [boolean, () => boolean] {
  const favorites = useFavorites();
  const toggle = useCallback(() => toggleFavorite(slug), [slug]);
  return [favorites.includes(slug), toggle];
}
