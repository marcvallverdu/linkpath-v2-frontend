import React from "react";

type Props = {
  expected: string[];
  found: string[];
};

export default function CookiesCompare({ expected, found }: Props) {
  const expectedSet = new Set(expected);
  const foundSet = new Set(found);

  const missing = expected.filter((cookie) => !foundSet.has(cookie));
  const extra = found.filter((cookie) => !expectedSet.has(cookie));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">
          Expected
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {expected.length ? (
            expected.map((cookie) => (
              <span
                key={cookie}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
              >
                {cookie}
              </span>
            ))
          ) : (
            <span className="text-sm text-white/50">None provided</span>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">
          Found
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {found.length ? (
            found.map((cookie) => (
              <span
                key={cookie}
                className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100"
              >
                {cookie}
              </span>
            ))
          ) : (
            <span className="text-sm text-white/50">No cookies returned</span>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">
          Gaps
        </div>
        <div className="mt-3 space-y-2 text-xs text-white/70">
          <div>
            Missing: {missing.length ? missing.join(", ") : "None"}
          </div>
          <div>Extra: {extra.length ? extra.join(", ") : "None"}</div>
        </div>
      </div>
    </div>
  );
}
