import React from "react";

export default function JsonViewer({ data }: { data: unknown }) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        No payload yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <pre className="whitespace-pre-wrap break-words text-xs text-emerald-100/90">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
