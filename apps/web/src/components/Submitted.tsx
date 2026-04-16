interface Props {
  submittedAt: string;
  tokenId: string;
  onReset: () => void;
}

export function Submitted({ submittedAt, tokenId, onReset }: Props): JSX.Element {
  return (
    <section className="rounded-xl border border-brand-green-500/40 bg-brand-green-500/10 p-6 space-y-4">
      <header>
        <h2 className="font-tight text-xl text-brand-green-500">
          Submitted ✓
        </h2>
        <p className="text-sm text-white/70">
          Badge <span className="font-mono">{tokenId}</span> has recorded its
          voting address. The server accepted your encrypted payload at{" "}
          <time className="font-mono">{submittedAt}</time>.
        </p>
      </header>
      <p className="text-xs text-white/50">
        Your plaintext voting address never left this browser — only the
        ciphertext + signed commitment were submitted.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg border border-white/15 hover:bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors"
      >
        Start over
      </button>
    </section>
  );
}
