import type { IssueSeverity } from "../lib/types";

const styles: Record<IssueSeverity, string> = {
  error: "bg-red-500/20 text-red-100 border-red-400/40",
  warning: "bg-amber-400/20 text-amber-100 border-amber-400/40",
  info: "bg-sky-400/20 text-sky-100 border-sky-400/40"
};

export default function Badge({ severity }: { severity: IssueSeverity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}
