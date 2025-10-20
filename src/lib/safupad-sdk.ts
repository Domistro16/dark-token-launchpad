"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import type { BrowserProvider } from "ethers";
import { SafuPadSDK } from "@safupad/sdk";

// Minimal typing for injected providers
declare global {
  interface Window {
    ethereum?: any;
  }
}

export type UseSafuPadSDKResult = {
  sdk: SafuPadSDK | null;
  isInitializing: boolean;
  error: unknown | null;
  connect: () => Promise<string | null>;
};

/**
 * useSafuPadSDK
 * - Initializes a singleton SafuPadSDK instance using the injected wallet provider
 * - Network is locked to BSC Testnet as requested
 */
export function useSafuPadSDK(): UseSafuPadSDKResult {
  const { isConnected } = useAccount();

  const [sdk, setSdk] = useState<SafuPadSDK | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const initializedRef = useRef<string | null>(null); // key: `${network}`

  // Lock to bscTestnet regardless of connected chain
  const network = useMemo(() => "bscTestnet" as const, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!window.ethereum) {
        setError(new Error("No injected wallet provider found (window.ethereum)."));
        setSdk(null);
        return;
      }

      const key = `${network}`;
      if (initializedRef.current === key && sdk) return;

      setIsInitializing(true);
      setError(null);

      try {
        const instance = new SafuPadSDK({
          network,
          provider: window.ethereum as unknown as BrowserProvider,
        });
        await instance.initialize();
        if (cancelled) return;
        initializedRef.current = key;
        setSdk(instance);
      } catch (e) {
        if (cancelled) return;
        setError(e);
        setSdk(null);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [network]);

  const connect = async () => {
    try {
      if (!sdk) return null;
      const address = await sdk.connect();
      return address ?? null;
    } catch (e) {
      setError(e);
      return null;
    }
  };

  // If user disconnects, keep SDK but user can reconnect via connect()
  useEffect(() => {
    if (!isConnected) return;
    // Optional: auto-connect when wallet is already connected
    // void connect();
  }, [isConnected]);

  return { sdk, isInitializing, error, connect };
}