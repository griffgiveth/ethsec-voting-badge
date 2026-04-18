import { useAccount, useChainId } from "wagmi";
import { WalletConnect } from "./WalletConnect.js";
import { TokenInput } from "./TokenInput.js";
import { Progress } from "./Progress.js";
import { Submitted } from "./Submitted.js";
import { ErrorState } from "./ErrorState.js";
import { useSubmission } from "../hooks/useSubmission.js";
import { expectedChain } from "../wagmi.js";

interface Props {
  onBack: () => void;
}

/**
 * Normal online flow: connect a wallet, auto-detect the held badge, encrypt
 * + sign the voting address, POST to /submit. Behaviour is preserved
 * verbatim from the original single-page app — all that changed is the
 * landing page now offers a sibling "Offline mode" that lives elsewhere.
 */
export function OnlineApp({ onBack }: Props): JSX.Element {
  const { address, status: accountStatus } = useAccount();
  const chainId = useChainId();
  const { state, start, reset } = useSubmission();

  const wrongChain = accountStatus === "connected" && chainId !== expectedChain.id;
  const canStart =
    accountStatus === "connected" &&
    !wrongChain &&
    (state.status === "idle" || state.status === "selecting_token");

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-14">
      <div className="w-full max-w-lg space-y-6">
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue-500/20 px-3 py-1 text-xs font-medium text-brand-blue-500 ring-1 ring-brand-blue-500/30">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-green-500 animate-pulse" />
            ETHSecurity
          </div>
          <h1 className="font-tight text-3xl sm:text-4xl tracking-tight leading-tight">
            Voting Badge
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Submit a private voting address tied to your ETHSecurity badge.
            Your choice is encrypted in-browser and signed with your wallet.
          </p>
        </header>

        <WalletConnect />

        {wrongChain && (
          <div className="rounded-xl border border-brand-red-500/30 bg-brand-red-500/10 p-4 text-center text-sm text-white/80">
            Please switch to <span className="font-medium text-white">{expectedChain.name}</span> in the wallet modal above.
          </div>
        )}

        {address && !wrongChain && (
          <div className="space-y-4 animate-fadeIn">
            {(state.status === "idle" || state.status === "selecting_token") && (
              <TokenInput onSubmit={start} disabled={!canStart} />
            )}

            {(state.status === "loading_config" ||
              state.status === "encrypting" ||
              state.status === "signing" ||
              state.status === "submitting") && <Progress status={state.status} />}

            {state.status === "submitted" && state.submittedAt && state.tokenId && (
              <Submitted
                submittedAt={state.submittedAt}
                tokenId={state.tokenId}
                onReset={reset}
              />
            )}

            {state.status === "error" && state.error && (
              <ErrorState
                code={state.error.code}
                message={state.error.message}
                onReset={reset}
              />
            )}
          </div>
        )}

        <footer className="text-center pt-2">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            ← Back to mode select
          </button>
        </footer>
      </div>
    </main>
  );
}
