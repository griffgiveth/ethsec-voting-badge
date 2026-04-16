import type { SubmissionStatus } from "../state/submission.js";

const labels: Partial<Record<SubmissionStatus, string>> = {
  loading_config: "Fetching encryption key…",
  encrypting: "Encrypting your vote in-browser…",
  signing: "Waiting for wallet signature…",
  submitting: "Submitting to the server…",
};

export function Progress({ status }: { status: SubmissionStatus }): JSX.Element {
  const label = labels[status] ?? "Working…";
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-blue-500 animate-pulse" />
        <p className="text-sm text-white/80">{label}</p>
      </div>
      <p className="text-xs text-white/40">
        Don&apos;t close the tab. If your wallet opened a signing prompt, approve
        it to continue.
      </p>
    </section>
  );
}
