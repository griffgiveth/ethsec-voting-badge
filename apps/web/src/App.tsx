import { useState } from "react";
import { OnlineApp } from "./components/OnlineApp.js";
import { OfflineApp } from "./components/OfflineApp.js";
import { AdminPage } from "./components/AdminPage.js";

type View = "landing" | "online" | "offline" | "admin";

export default function App(): JSX.Element {
  const [view, setView] = useState<View>("landing");

  if (view === "online") return <OnlineApp onBack={() => setView("landing")} />;
  if (view === "offline") return <OfflineApp onBack={() => setView("landing")} />;
  if (view === "admin") return <AdminPage onBack={() => setView("landing")} />;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 sm:py-20">
      <div className="w-full max-w-2xl space-y-10">
        {/* Header */}
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue-500/20 px-3 py-1 text-xs font-medium text-brand-blue-500 ring-1 ring-brand-blue-500/30">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-green-500 animate-pulse" />
            ETHSecurity
          </div>
          <h1 className="font-tight text-4xl sm:text-5xl tracking-tight leading-tight">
            Voting Badge
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Badgeholders submit a private voting address. Addresses are encrypted
            in the browser and decrypted offline by the admin after voting closes.
          </p>
        </header>

        {/* Mode buttons */}
        <section className="grid sm:grid-cols-2 gap-4">
          <ModeCard
            onClick={() => setView("online")}
            title="Online"
            badge="normal"
            badgeClass="bg-brand-green-500/15 text-brand-green-500 ring-brand-green-500/30"
            description="Connect your wallet in this browser, sign the voting message, and submit."
            bullets={[
              "RainbowKit + any supported wallet",
              "Auto-detects your badge tokenId onchain",
              "One-click submit when signed",
            ]}
          />
          <ModeCard
            onClick={() => setView("offline")}
            title="Offline"
            badge="airgapped"
            badgeClass="bg-brand-red-500/15 text-brand-red-500 ring-brand-red-500/30"
            description="For signers whose keys live on an airgapped machine. Sign locally, export a blob, submit later from an online machine."
            bullets={[
              "Run this page locally on an offline machine",
              "Sign via a local wallet OR copy-paste EIP-712",
              "Upload the signed blob from any online machine",
            ]}
          />
        </section>

        <footer className="text-center text-xs text-white/30 pt-4">
          <p>ETHSecurity Voting Badge &middot; DAO.fund</p>
          <button
            onClick={() => setView("admin")}
            className="mt-2 text-white/20 hover:text-white/40 text-xs transition-colors"
          >
            Admin
          </button>
        </footer>
      </div>
    </main>
  );
}

interface ModeCardProps {
  onClick: () => void;
  title: string;
  badge: string;
  badgeClass: string;
  description: string;
  bullets: string[];
}

function ModeCard({ onClick, title, badge, badgeClass, description, bullets }: ModeCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 sm:p-7 hover:border-brand-blue-500/40 hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <h2 className="font-tight text-2xl">{title}</h2>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ${badgeClass}`}>
          {badge}
        </span>
      </div>
      <p className="mt-3 text-sm text-white/60 leading-relaxed">{description}</p>
      <ul className="mt-4 space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="text-xs text-white/40 flex gap-2">
            <span className="text-white/30">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 text-xs font-medium text-brand-blue-500 group-hover:text-brand-blue-500">
        Open →
      </div>
    </button>
  );
}
