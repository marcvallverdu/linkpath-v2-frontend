import Badge from "./Badge";
import type { IssueSeverity } from "../lib/types";

type Issue = {
  severity: IssueSeverity;
  message: string;
};

export default function IssuesList({ issues }: { issues: Issue[] }) {
  if (!issues?.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
        No issues reported.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <div className="space-y-3">
        {issues.map((issue, index) => (
          <div
            key={`${issue.message}-${index}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <Badge severity={issue.severity} />
            <p className="text-sm text-white/80">{issue.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
