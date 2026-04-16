import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import type { Chain } from "viem";
import { APP_CONFIG } from "./config.js";

const SUPPORTED: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
};

const chain: Chain = SUPPORTED[APP_CONFIG.chainId] ?? mainnet;

const connectors = [
  injected({ shimDisconnect: true }),
  ...(APP_CONFIG.walletConnectProjectId
    ? [
        walletConnect({
          projectId: APP_CONFIG.walletConnectProjectId,
          showQrModal: true,
          metadata: {
            name: "ETHSecurity Voting Badge",
            description: "Submit a private voting address tied to your ETHSecurity Badge.",
            url: typeof window !== "undefined" ? window.location.origin : "https://ethsec.local",
            icons: [],
          },
        }),
      ]
    : []),
];

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors,
  transports: { [chain.id]: http() },
});

export const expectedChain = chain;
