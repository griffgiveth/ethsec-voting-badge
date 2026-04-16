import { useState } from "react";
import { isAddress } from "viem";
import type { Address } from "viem";

interface Props {
  onSubmit: (tokenId: string, votingAddress: Address) => void;
  disabled?: boolean;
}

/**
 * Form for the "selecting_token" / "idle" states. Collects the badge
 * tokenId and the voting address the user wants to delegate to, validates
 * both client-side, then hands off to the orchestrator.
 */
export function TokenInput({ onSubmit, disabled }: Props): JSX.Element {
  const [tokenId, setTokenId] = useState("");
  const [votingAddress, setVotingAddress] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!/^\d+$/.test(tokenId)) {
      setErr("Token ID must be a positive integer.");
      return;
    }
    if (!isAddress(votingAddress)) {
      setErr("Voting address must be a valid 0x-prefixed EVM address.");
      return;
    }
    setErr(null);
    onSubmit(tokenId, votingAddress as Address);
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      <header>
        <h2 className="font-tight text-xl">Cast your voting address</h2>
        <p className="text-sm text-white/60">
          Enter the tokenId of your ETHSecurity badge and the address you want
          to delegate your voting power to. Your address is encrypted in the
          browser before it leaves your machine.
        </p>
      </header>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="tokenId" className="text-xs text-white/60">
            Badge token ID
          </label>
          <input
            id="tokenId"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            disabled={disabled}
            placeholder="e.g. 42"
            inputMode="numeric"
            className="w-full rounded-lg bg-black/40 border border-white/10 focus:border-brand-blue-500 px-3 py-2 text-sm font-mono outline-none disabled:opacity-50"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="votingAddress" className="text-xs text-white/60">
            Voting address (where your vote weight goes)
          </label>
          <input
            id="votingAddress"
            value={votingAddress}
            onChange={(e) => setVotingAddress(e.target.value)}
            disabled={disabled}
            placeholder="0x…"
            className="w-full rounded-lg bg-black/40 border border-white/10 focus:border-brand-blue-500 px-3 py-2 text-sm font-mono outline-none disabled:opacity-50"
          />
        </div>
        {err && (
          <p role="alert" className="text-sm text-brand-red-500">
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-brand-green-500 hover:bg-brand-green-500/80 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
        >
          Encrypt &amp; sign
        </button>
      </form>
    </section>
  );
}
