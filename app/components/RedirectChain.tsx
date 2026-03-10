import React from "react";

type RedirectHop = {
  url?: string;
  status?: number | string;
};

export default function RedirectChain({
  hops
}: {
  hops: RedirectHop[] | null;
}) {
  if (!hops || hops.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
        Redirect chain not available.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <div className="flex flex-wrap items-center gap-3">
        {hops.map((hop, index) => (
          <React.Fragment key={`${hop.url ?? "hop"}-${index}`}>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80 max-w-[18rem]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                Hop {index + 1}
              </div>
              <div className="mt-1 break-words">{hop.url ?? "Unknown URL"}</div>
              {hop.status !== undefined && (
                <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-emerald-200/80">
                  Status {hop.status}
                </div>
              )}
            </div>
            {index < hops.length - 1 && (
              <div className="text-emerald-200/60 text-xl">→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
