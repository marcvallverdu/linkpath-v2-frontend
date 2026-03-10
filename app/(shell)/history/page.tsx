"use client";

import { useEffect, useState } from "react";
import JsonViewer from "../../components/JsonViewer";
import { STORAGE_KEYS } from "../../lib/storage";
import type { HistoryItem } from "../../lib/types";
import { useLocalStorage } from "../../lib/useLocalStorage";

export default function HistoryPage() {
  const historyStore = useLocalStorage<HistoryItem[]>(STORAGE_KEYS.history, []);
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (historyStore.value.length && !selected) {
      setSelected(historyStore.value[0]);
    }
  }, [historyStore.value, selected]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <h2 className="text-2xl font-[var(--font-display)]">Results history</h2>
        <p className="text-sm text-white/60">
          Cached locally in this browser session.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1.2fr]">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <h3 className="text-lg font-[var(--font-display)]">Recent runs</h3>
          <div className="mt-4 space-y-3">
            {historyStore.value.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                No saved results yet.
              </div>
            )}
            {historyStore.value.map((item) => {
              const active = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-emerald-400/40 bg-emerald-400/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                    {item.status}
                  </div>
                  <div className="mt-2 text-sm text-white/80 break-words">
                    {item.url}
                  </div>
                  <div className="mt-2 text-[11px] text-white/40">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-[var(--font-display)]">Selected result</h3>
          <JsonViewer data={selected?.result ?? null} />
        </div>
      </section>
    </div>
  );
}
