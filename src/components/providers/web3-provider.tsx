"use client";

import { ReactNode, useState } from "react";
import { WagmiProvider, cookieStorage, createStorage } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

// Use a safe fallback to prevent runtime crashes if the env var is missing
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "dev-fallback-project-id";

const config = getDefaultConfig({
  appName: "Safupad",
  projectId: walletConnectProjectId,
  chains: [bsc, bscTestnet],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#FFB000",
            accentColorForeground: "#0a0a0f",
            borderRadius: "medium",
            overlayBlur: "small",
          })}
          initialChain={bscTestnet}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}