"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchStatus, submitBatch } from "../../lib/api";
import { pushHistory, STORAGE_KEYS } from "../../lib/storage";
import type { BrowserProfile, ConsentMode, TestDepth } from "../../lib/types";
import { useLocalStorage } from "../../lib/useLocalStorage";

const defaultKey = "lp_5Bv3hi82gzsLgNK3U4Xf3F6lpfnf_1N6";
const defaultBase = "https://app.uselinkpath.com";

type BatchJob = {
  url: string;
  jobId: string;
  statusUrl: string;
  status: string;
  result?: Record<string, unknown> | null;
};

export default function BatchPage() {
  const apiKey = useLocalStorage<string>(STORAGE_KEYS.apiKey, defaultKey);
  const apiBaseUrl = useLocalStorage<string>(STORAGE_KEYS.apiBaseUrl, defaultBase);

  const [rawUrls, setRawUrls] = useState("");
  const [depth, setDepth] = useState<TestDepth>("redirect");
  const [browserProfile, setBrowserProfile] = useState<BrowserProfile>("chrome");
  const [consentMode, setConsentMode] = useState<ConsentMode>("accept_all");
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedUrls = useMemo(
    () =>
      rawUrls
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [rawUrls]
  );

  useEffect(() => {
    if (!jobs.length || !apiKey.value) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const updates = await Promise.all(
          jobs.map(async (job) => {
            if (job.status === "completed" || job.status === "failed") return job;
            const data = await fetchStatus(
              apiBaseUrl.value,
              apiKey.value,
              job.statusUrl
            );
            if (data.status === "completed" || data.status === "failed") {
              pushHistory({
                id: data.jobId,
                url: job.url,
                status: data.status,
                createdAt: new Date().toISOString(),
                result: (data.result ?? null) as Record<string, unknown> | null
              });
            }
            return {
              ...job,
              status: data.status,
              result: (data.result ?? null) as Record<string, unknown> | null
            };
          })
        );
        if (!cancelled) setJobs(updates);
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
  }, [jobs, apiBaseUrl.value, apiKey.value]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const tests = parsedUrls.map((url) => ({
        url,
        depth,
        browserProfile,
        consentMode
      }));

      const response = await submitBatch(apiBaseUrl.value, apiKey.value, tests);
      const nextJobs = response.jobs.map((job, index) => ({
        url: tests[index]?.url ?? "Unknown",
        jobId: job.jobId,
        statusUrl: job.statusUrl,
        status: job.status,
        result: null
      }));
      setJobs(nextJobs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-[var(--font-display)]">Batch test</h2>
            <p className="text-sm text-white/60">
              Paste up to 100 URLs and monitor them in parallel.
            </p>
          </div>
          <button
            onClick={submit}
            disabled={submitting || parsedUrls.length === 0 || !apiKey.value}
            className="rounded-full bg-emerald-400/90 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit batch"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-white/40">
              URLs (one per line)
            </label>
            <textarea
              value={rawUrls}
              onChange={(event) => setRawUrls(event.target.value)}
              rows={8}
              placeholder="https://example.com/link1\nhttps://example.com/link2"
              className="mt-2 w-full rounded-2xl px-4 py-3 text-sm"
            />
            <div className="mt-2 text-xs text-white/50">
              Parsed: {parsedUrls.length} URL(s)
            </div>
          </div>
          <div className="space-y-4">
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
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-[var(--font-display)]">Progress</h3>
          <span className="text-xs text-white/40">
            {jobs.length} jobs tracked
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-white/40">
              <tr>
                <th className="pb-3">URL</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Job ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-white/50">
                    No batch running yet.
                  </td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr key={job.jobId} className="text-white/70">
                  <td className="py-4 pr-4 max-w-[22rem] break-words">
                    {job.url}
                  </td>
                  <td className="py-4 capitalize">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide border ${
                        job.status === "completed"
                          ? "bg-emerald-400/20 text-emerald-100 border-emerald-400/40"
                          : job.status === "failed"
                          ? "bg-red-500/20 text-red-100 border-red-400/40"
                          : "bg-white/10 text-white/70 border-white/10"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-white/50">{job.jobId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
