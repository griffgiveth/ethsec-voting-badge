import { useMemo } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { expectedChain } from "../wagmi.js";

/**
 * Minimal wallet UI block.
 *
 * - Lists every available connector (injected/MetaMask/Rabby, optionally
 *   WalletConnect when a project id is configured).
 * - Once connected, surfaces the address + chain and prompts a switch when the
 *   user is on the wrong network.
 *
 * Pure presentation + wagmi hooks — the orchestrator state machine lives in
 * `useSubmission` and reads `useAccount()` directly.
 */
export function WalletConnect(): JSX.Element {
  const { address, status: accountStatus, connector } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, status: connectStatus, error: connectError, variables } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    switchChain,
    status: switchStatus,
    error: switchError,
  } = useSwitchChain();

  const wrongChain = useMemo(
    () => accountStatus === "connected" && chainId !== expectedChain.id,
    [accountStatus, chainId],
  );

  if (accountStatus === "disconnected") {
    return (
      <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <header>
          <h2 className="font-tight text-xl">Connect a wallet</h2>
          <p className="text-sm text-white/60">
            Use the wallet that holds your ETHSecurity badge.
          </p>
        </header>
        <div className="flex flex-wrap gap-3">
          {connectors.map((c) => {
            const isPending =
              connectStatus === "pending" && variables?.connector === c;
            return (
              <button
                key={c.uid}
                type="button"
                onClick={() => connect({ connector: c })}
                disabled={connectStatus === "pending"}
                className="rounded-lg bg-brand-blue-500 hover:bg-brand-blue-500/80 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
              >
                {isPending ? "Connecting…" : c.name}
              </button>
            );
          })}
        </div>
        {connectError && (
          <p role="alert" className="text-sm text-brand-red-500">
            {connectError.message}
          </p>
        )}
      </section>
    );
  }

  if (accountStatus === "connecting" || accountStatus === "reconnecting") {
    return (
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/70">Connecting wallet…</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-tight text-xl">Wallet connected</h2>
          <p className="text-xs text-white/50">
            via {connector?.name ?? "wallet"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded-lg border border-white/15 hover:bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors"
        >
          Disconnect
        </button>
      </header>
      <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-white/50">Address</dt>
        <dd className="font-mono break-all">{address}</dd>
        <dt className="text-white/50">Chain</dt>
        <dd>
          {chainId}
          {wrongChain && (
            <span className="ml-2 text-brand-red-500">
              (expected {expectedChain.id} — {expectedChain.name})
            </span>
          )}
        </dd>
      </dl>
      {wrongChain && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => switchChain({ chainId: expectedChain.id })}
            disabled={switchStatus === "pending"}
            className="rounded-lg bg-brand-red-500 hover:bg-brand-red-500/80 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
          >
            {switchStatus === "pending"
              ? "Switching…"
              : `Switch to ${expectedChain.name}`}
          </button>
          {switchError && (
            <p role="alert" className="text-sm text-brand-red-500">
              {switchError.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
