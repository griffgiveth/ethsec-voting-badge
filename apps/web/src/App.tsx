import { useAccount, useChainId } from "wagmi";
import { WalletConnect } from "./components/WalletConnect.js";
import { TokenInput } from "./components/TokenInput.js";
import { Progress } from "./components/Progress.js";
import { Submitted } from "./components/Submitted.js";
import { ErrorState } from "./components/ErrorState.js";
import { useSubmission } from "./hooks/useSubmission.js";
import { expectedChain } from "./wagmi.js";

export default function App(): JSX.Element {
  const { address, status: accountStatus } = useAccount();
  const chainId = useChainId();
  const { state, start, reset } = useSubmission();

  const wrongChain = accountStatus === "connected" && chainId !== expectedChain.id;
  const canStart =
    accountStatus === "connected" &&
    !wrongChain &&
    (state.status === "idle" || state.status === "selecting_token");

  return (
    <main className="max-w-2xl mx-auto p-6 sm:p-10 space-y-6">
      <header className="space-y-2">
        <h1 className="font-tight text-3xl sm:text-4xl tracking-tight">
          ETHSecurity Voting Badge
        </h1>
        <p className="text-white/70 text-sm sm:text-base">
          Submit a private voting address tied to your ETHSecurity badge. Your
          choice is encrypted in the browser and signed with your wallet.
        </p>
      </header>

      <WalletConnect />

      {address && !wrongChain && (
        <>
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
        </>
      )}
    </main>
  );
}
