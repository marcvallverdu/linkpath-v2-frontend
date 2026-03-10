"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalStorage } from "../lib/useLocalStorage";
import { STORAGE_KEYS } from "../lib/storage";

const defaultKey = "lp_5Bv3hi82gzsLgNK3U4Xf3F6lpfnf_1N6";
const defaultBase = "https://app.uselinkpath.com";

export default function Sidebar() {
  const pathname = usePathname();
  const apiKey = useLocalStorage<string>(STORAGE_KEYS.apiKey, defaultKey);
  const apiBaseUrl = useLocalStorage<string>(STORAGE_KEYS.apiBaseUrl, defaultBase);

  return (
    <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/40 backdrop-blur">
      <div className="p-6 flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            LinkPath Lab
          </p>
          <h1 className="mt-2 text-2xl font-[var(--font-display)] text-white">
            Internal Tester
          </h1>
          <p className="mt-3 text-sm text-white/60 leading-relaxed">
            Client-side harness for the LinkPath API. Built for fast, visual
            validation loops.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-white/50">
              API key
            </label>
            <input
              value={apiKey.value}
              onChange={(event) => apiKey.setValue(event.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-white/50">
              Base URL
            </label>
            <input
              value={apiBaseUrl.value}
              onChange={(event) => apiBaseUrl.setValue(event.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
            />
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { href: "/test", label: "Single Test" },
            { href: "/batch", label: "Batch Test" },
            { href: "/history", label: "Results History" }
          ].map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-100/80">
          CORS note: if the API blocks browser requests, route calls through a
          Next.js proxy API route or a local dev reverse proxy.
        </div>
      </div>
    </aside>
  );
}
