"use client";

import { useEffect, useRef, useState } from "react";
import { SafuPadSDK } from "@safupad/sdk";
import { ethers } from "ethers";
import { useWalletClient } from "wagmi";

export type UseSafuPadSDKResult = {
  sdk: SafuPadSDK | null;
  isInitializing: boolean;
  error: unknown | null;
  connect: () => Promise<string | null>;
};

/**
 * Gets the appropriate provider for BSC Testnet (chainId 97)
 * Falls back to JsonRpcProvider if wallet is not connected
 */
async function getBscTestnetProvider(walletClient?: any) {
  // BSC Testnet RPC endpoint
  const BSC_TESTNET_RPC = "https://bnb-testnet.g.alchemy.com/v2/tTuJSEMHVlxyDXueE8Hjv";
  
  // If wallet is connected, use it
  if (walletClient) {
    try {
      console.log("✅ SafuPad SDK: Using connected wallet provider");
      return walletClient;
    } catch (err) {
      console.warn("⚠️ SafuPad SDK: Could not use wallet provider, using RPC fallback", err);
    }
  }
  
  // Fallback to JsonRpcProvider for BSC Testnet (read-only)
  console.log("🔧 SafuPad SDK: Using JsonRpcProvider for BSC Testnet (read-only mode)");
  return new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
}

/**
 * useSafuPadSDK
 * - Initializes SafuPadSDK instance synchronized with RainbowKit wallet connection
 * - Network is locked to BSC Testnet
 * - Falls back to JsonRpcProvider for read-only operations when wallet is disconnected
 */
export function useSafuPadSDK(): UseSafuPadSDKResult {
  const [sdk, setSdk] = useState<SafuPadSDK | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const initAttempted = useRef(false);
  
  // Get wallet client from wagmi (connected wallet)
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    // Reset initialization flag when wallet connection changes
    initAttempted.current = false;
  }, [walletClient]);

  useEffect(() => {
    // Prevent double initialization
    if (initAttempted.current) return;
    initAttempted.current = true;

    let cancelled = false;

    async function init() {
      console.log("🔧 SafuPad SDK: Starting initialization...");

      setIsInitializing(true);
      setError(null);

      try {
        console.log("🔧 SafuPad SDK: Getting BSC Testnet provider...");
        const provider = await getBscTestnetProvider(walletClient);
        
        console.log("🔧 SafuPad SDK: Creating SDK instance with bscTestnet...");
        
        const instance = new SafuPadSDK({
          network: "bscTestnet",
          provider: provider,
        });

        console.log("🔧 SafuPad SDK: Calling initialize()...");
        await instance.initialize();

        if (cancelled) {
          console.log("⚠️ SafuPad SDK: Initialization cancelled");
          return;
        }

        console.log("✅ SafuPad SDK: Successfully initialized!");
        setSdk(instance);
        
      } catch (e: any) {
        if (cancelled) return;
        
        console.error("❌ SafuPad SDK: Initialization failed:", e);
        console.error("Error details:", {
          message: e?.message,
          code: e?.code,
          data: e?.data,
        });
        
        setError(e);
        setSdk(null);
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [walletClient]); // Re-initialize when wallet connection changes

  const connect = async () => {
    console.log("🔗 SafuPad SDK: Connect called");
    
    if (!walletClient) {
      console.warn("⚠️ SafuPad SDK: No wallet connected. Please connect via RainbowKit first.");
      return null;
    }

    if (!sdk) {
      console.error("❌ SafuPad SDK: Cannot connect - SDK not initialized");
      return null;
    }

    try {
      // SDK should already be connected via walletClient
      const address = walletClient.account?.address;
      console.log("✅ SafuPad SDK: Using connected address:", address);
      return address ?? null;
    } catch (e: any) {
      console.error("❌ SafuPad SDK: Connection failed:", e);
      setError(e);
      return null;
    }
  };

  return { sdk, isInitializing, error, connect };
}