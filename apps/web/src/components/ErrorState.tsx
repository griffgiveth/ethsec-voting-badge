interface Props {
  code: string;
  message: string;
  onReset: () => void;
}

export function ErrorState({ code, message, onReset }: Props): JSX.Element {
  return (
    <section className="rounded-xl border border-brand-red-500/40 bg-brand-red-500/10 p-6 space-y-4">
      <header>
        <h2 className="font-tight text-xl text-brand-red-500">
          Something broke
        </h2>
        <p className="text-xs text-white/50">
          <span className="font-mono">{code}</span>
        </p>
      </header>
      <p className="text-sm text-white/80">{message}</p>
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg bg-brand-red-500 hover:bg-brand-red-500/80 px-4 py-2 text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </section>
  );
}
