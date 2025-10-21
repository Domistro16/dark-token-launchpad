"use client";

import { useEffect, useRef, useState } from "react";
import { SafuPadSDK } from "@safupad/sdk";
import { ethers } from "ethers";

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
 * Gets the appropriate provider for BSC Testnet (chainId 97)
 * Falls back to JsonRpcProvider if window.ethereum is not on the correct network
 */
async function getBscTestnetProvider() {
  // BSC Testnet RPC endpoint
  const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
  
  if (window.ethereum) {
    try {
      // Check current chainId
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdDecimal = parseInt(chainId, 16);
      
      console.log(`🔧 SafuPad SDK: Detected chainId: ${chainIdDecimal}`);
      
      if (chainIdDecimal === 97) {
        console.log("✅ SafuPad SDK: Using window.ethereum (already on BSC Testnet)");
        return window.ethereum;
      } else {
        console.log(`⚠️ SafuPad SDK: Wrong network (chainId ${chainIdDecimal}), falling back to JsonRpcProvider`);
      }
    } catch (err) {
      console.warn("⚠️ SafuPad SDK: Could not detect chainId, falling back to JsonRpcProvider", err);
    }
  }
  
  // Fallback to JsonRpcProvider for BSC Testnet
  console.log("🔧 SafuPad SDK: Using JsonRpcProvider for BSC Testnet");
  return new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
}

/**
 * useSafuPadSDK
 * - Initializes a singleton SafuPadSDK instance using the injected wallet provider
 * - Network is locked to BSC Testnet
 * - Falls back to JsonRpcProvider if wallet is on wrong network
 */
export function useSafuPadSDK(): UseSafuPadSDKResult {
  const [sdk, setSdk] = useState<SafuPadSDK | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initAttempted.current) return;
    initAttempted.current = true;

    let cancelled = false;

    async function init() {
      console.log("🔧 SafuPad SDK: Starting initialization...");

      setIsInitializing(true);
      setError(null);

      try {
        console.log("🔧 SafuPad SDK: Getting BSC Testnet provider...");
        const provider = await getBscTestnetProvider();
        
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
  }, []); // Empty deps - only run once

  const connect = async () => {
    console.log("🔗 SafuPad SDK: Attempting to connect wallet...");
    
    if (!sdk) {
      console.error("❌ SafuPad SDK: Cannot connect - SDK not initialized");
      return null;
    }

    try {
      const address = await sdk.connect();
      console.log("✅ SafuPad SDK: Connected to address:", address);
      return address ?? null;
    } catch (e: any) {
      console.error("❌ SafuPad SDK: Connection failed:", e);
      setError(e);
      return null;
    }
  };

  return { sdk, isInitializing, error, connect };
}