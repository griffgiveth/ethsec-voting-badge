import { WalletConnect } from "./components/WalletConnect.js";

export default function App(): JSX.Element {
  return (
    <main className="max-w-2xl mx-auto p-6 sm:p-10 space-y-8">
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
    </main>
  );
}
