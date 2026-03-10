"use client";

import React, { useEffect, useMemo, useState } from "react";
import CookiesCompare from "../../components/CookiesCompare";
import IssuesList from "../../components/IssuesList";
import JsonViewer from "../../components/JsonViewer";
import RedirectChain from "../../components/RedirectChain";
import { fetchStatus, submitTest } from "../../lib/api";
import { pushHistory, STORAGE_KEYS } from "../../lib/storage";
import type {
  BrowserProfile,
  ConsentMode,
  IssueSeverity,
  TestDepth,
  TestStatusResponse
} from "../../lib/types";
import { useLocalStorage } from "../../lib/useLocalStorage";

const defaultKey = "lp_5Bv3hi82gzsLgNK3U4Xf3F6lpfnf_1N6";
const defaultBase = "https://app.uselinkpath.com";

function normalizeCookies(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const name = record.name ?? record.cookie ?? record.key;
          if (typeof name === "string") return name;
        }
        return null;
      })
      .filter(Boolean) as string[];
  }
  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>);
  }
  return [];
}

function normalizeIssues(value: unknown) {
  if (!Array.isArray(value)) return [] as { severity: IssueSeverity; message: string }[];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const severity = (record.severity ?? "info") as IssueSeverity;
      const message =
        (record.message as string) ||
        (record.error as string) ||
        (record.title as string) ||
        "Unknown issue";
      return { severity, message };
    })
    .filter(Boolean) as { severity: IssueSeverity; message: string }[];
}

export default function TestPage() {
  const apiKey = useLocalStorage<string>(STORAGE_KEYS.apiKey, defaultKey);
  const apiBaseUrl = useLocalStorage<string>(STORAGE_KEYS.apiBaseUrl, defaultBase);

  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState<TestDepth>("redirect");
  const [expectCookies, setExpectCookies] = useState("");
  const [browserProfile, setBrowserProfile] = useState<BrowserProfile>("chrome");
  const [consentMode, setConsentMode] = useState<ConsentMode>("accept_all");
  const [consentCompare, setConsentCompare] = useState(false);
  const [productSelector, setProductSelector] = useState("");
  const [addToCartSelector, setAddToCartSelector] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [maxTurns, setMaxTurns] = useState(30);
  const [proxy, setProxy] = useState("");
  const [device, setDevice] = useState("");

  const [statusUrl, setStatusUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<TestStatusResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedCookiesList = useMemo(
    () =>
      expectCookies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [expectCookies]
  );

  useEffect(() => {
    if (!statusUrl || !apiKey.value) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await fetchStatus(apiBaseUrl.value, apiKey.value, statusUrl);
        if (cancelled) return;
        setStatus(data);
        if (data.status === "completed" || data.status === "failed") {
          const result = data.result ?? null;
          const finalUrl =
            (result as Record<string, unknown> | null)?.url ?? url ?? "Unknown";
          pushHistory({
            id: data.jobId,
            url: typeof finalUrl === "string" ? finalUrl : "Unknown",
            status: data.status,
            createdAt: new Date().toISOString(),
            result: result as Record<string, unknown> | null
          });
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    };

    poll();
    const interval = window.setInterval(poll, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [statusUrl, apiBaseUrl.value, apiKey.value, url]);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    setStatus(null);

    const payload = {
      url,
      depth,
      expectCookies: expectedCookiesList.length ? expectedCookiesList : undefined,
      browserProfile,
      consentMode,
      consentCompare: consentCompare || undefined,
      productSelector: productSelector || undefined,
      addToCartSelector: addToCartSelector || undefined,
      model: model || undefined,
      maxTurns: maxTurns || undefined,
      proxy: proxy || undefined,
      device: device || undefined
    };

    try {
      const response = await submitTest(apiBaseUrl.value, apiKey.value, payload);
      setStatusUrl(response.statusUrl);
      setStatus({
        jobId: response.jobId,
        status: response.status
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-scroll to results when status changes
  const resultsRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  const result = status?.result as Record<string, unknown> | undefined;
  const redirectChain =
    (result?.redirectChain as unknown) ??
    ((status as unknown as Record<string, unknown>)?.redirectChain as unknown);
  const issues = normalizeIssues(result?.issues ?? (status as any)?.issues);
  // Extract cookies from all redirect chain hops + landing page
  const allCookies = useMemo(() => {
    const cookies: string[] = [];
    // From redirect chain
    const chain = result?.redirectChain as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(chain)) {
      for (const hop of chain) {
        const cookiesSet = hop.cookiesSet as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(cookiesSet)) {
          for (const c of cookiesSet) {
            if (typeof c.name === "string" && !cookies.includes(c.name)) {
              cookies.push(c.name);
            }
          }
        }
      }
    }
    // From landing page
    const landing = result?.landing as Record<string, unknown> | undefined;
    if (landing) {
      const present = landing.cookiesPresent as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(present)) {
        for (const c of present) {
          if (typeof c.name === "string" && !cookies.includes(c.name)) {
            cookies.push(c.name);
          }
        }
      }
      // Also check expectedCookies.found
      const expected = landing.expectedCookies as Record<string, unknown> | undefined;
      if (expected?.found && Array.isArray(expected.found)) {
        for (const name of expected.found) {
          if (typeof name === "string" && !cookies.includes(name)) {
            cookies.push(name);
          }
        }
      }
    }
    return cookies;
  }, [result]);
  const cookiesFound = allCookies;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-[var(--font-display)]">Single test</h2>
            <p className="text-sm text-white/60">
              Run a single affiliate link test and follow its lifecycle.
            </p>
          </div>
          <button
            onClick={submit}
            disabled={submitting || !url || !apiKey.value}
            className="rounded-full bg-emerald-400/90 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit test"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                URL (required)
              </label>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/affiliate"
                className="mt-2 w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Depth
                </label>
                <select
                  value={depth}
                  onChange={(event) => setDepth(event.target.value as TestDepth)}
                  className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
                >
                  <option value="redirect">redirect</option>
                  <option value="landing">landing</option>
                  <option value="checkout">checkout</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Browser profile
                </label>
                <select
                  value={browserProfile}
                  onChange={(event) =>
                    setBrowserProfile(event.target.value as BrowserProfile)
                  }
                  className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
                >
                  <option value="chrome">chrome</option>
                  <option value="safari">safari</option>
                  <option value="mobile-chrome">mobile-chrome</option>
                  <option value="mobile-safari">mobile-safari</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Consent mode
                </label>
                <select
                  value={consentMode}
                  onChange={(event) =>
                    setConsentMode(event.target.value as ConsentMode)
                  }
                  className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
                >
                  <option value="accept_all">accept_all</option>
                  <option value="reject_all">reject_all</option>
                  <option value="manage_necessary_only">
                    manage_necessary_only
                  </option>
                </select>
              </div>
              <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <input
                  type="checkbox"
                  checked={consentCompare}
                  onChange={(event) => setConsentCompare(event.target.checked)}
                  className="h-4 w-4 accent-emerald-400"
                />
                <span className="text-sm text-white/70">Consent compare</span>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                Expect cookies (comma-separated)
              </label>
              <input
                value={expectCookies}
                onChange={(event) => setExpectCookies(event.target.value)}
                placeholder="affiliate_id, partner"
                className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                Product selector
              </label>
              <input
                value={productSelector}
                onChange={(event) => setProductSelector(event.target.value)}
                className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                Add to cart selector
              </label>
              <input
                value={addToCartSelector}
                onChange={(event) => setAddToCartSelector(event.target.value)}
                className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                Model
              </label>
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                Max turns
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxTurns}
                onChange={(event) => setMaxTurns(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                Proxy
              </label>
              <input
                value={proxy}
                onChange={(event) => setProxy(event.target.value)}
                className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                Device
              </label>
              <input
                value={device}
                onChange={(event) => setDevice(event.target.value)}
                className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}
      </section>

      {status && (
        <div ref={resultsRef} className={`rounded-2xl border px-5 py-4 text-sm font-medium flex items-center gap-3 ${
          status.status === "completed" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" :
          status.status === "failed" ? "border-red-400/30 bg-red-400/10 text-red-200" :
          "border-blue-400/30 bg-blue-400/10 text-blue-200"
        }`}>
          {(status.status === "pending" || status.status === "active") && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          )}
          {status.status === "completed" && "✅ "}
          {status.status === "failed" && "❌ "}
          Test {status.status}{status.jobId ? ` — ${status.jobId.slice(0, 8)}…` : ""}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-[var(--font-display)]">Redirect chain</h3>
          <RedirectChain
            hops={Array.isArray(redirectChain) ? (redirectChain as any[]) : null}
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-[var(--font-display)]">Cookies</h3>
          <CookiesCompare expected={expectedCookiesList} found={cookiesFound} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-[var(--font-display)]">Issues</h3>
          <IssuesList issues={issues} />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-[var(--font-display)]">Raw result</h3>
          <JsonViewer data={status} />
        </div>
      </section>
    </div>
  );
}
