import type { HistoryItem } from "./types";

export const STORAGE_KEYS = {
  apiKey: "linkpath-api-key",
  apiBaseUrl: "linkpath-api-base-url",
  history: "linkpath-history"
} as const;

export function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.history);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

export function writeHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(items));
  } catch {
    // Ignore write errors.
  }
}

export function pushHistory(item: HistoryItem) {
  const existing = readHistory();
  const next = [item, ...existing].slice(0, 50);
  writeHistory(next);
  return next;
}
