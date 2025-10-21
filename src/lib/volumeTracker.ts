// lib/volumeTracker.ts
import { ethers } from 'ethers';
import type { SafuPadSDK } from '@safupad/sdk';

interface VolumeCache {
  volume: number;
  timestamp: number;
}

export interface VolumeData {
  volumeBNB: number;
  volumeUSD: number;
  buyCount: number;
  sellCount: number;
  lastUpdated: Date;
}

const volumeCache = new Map<string, VolumeCache>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BLOCKS_PER_DAY = 28800; // BSC: ~3 seconds per block

/**
 * Calculate 24h trading volume for a token
 */
export async function calculate24hVolume(
  sdk: SafuPadSDK,
  tokenAddress: string
): Promise<VolumeData> {
  if (!sdk || !tokenAddress) {
    throw new Error('SDK and token address are required');
  }

  try {
    // Get current block
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
    const currentBlock = await provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlock - BLOCKS_PER_DAY);

    console.log(`Fetching volume for ${tokenAddress} from block ${startBlock} to ${currentBlock}`);


  const bonding = sdk?.bondingDex.getContract()

    // Fetch buy and sell events in parallel
    const [buyEvents, sellEvents] = await Promise.all([
      bonding?.queryFilter(
        bonding?.filters.TokensBought(null, tokenAddress),
        startBlock,
        currentBlock
      ),
      bonding?.queryFilter(
        bonding?.filters.TokensSold(null, tokenAddress),
        startBlock,
        currentBlock
      )
    ]);

    // Calculate total volume in BNB
    let totalVolumeBNB = 0n;

    // Sum buy volumes
    buyEvents.forEach((event) => {
      totalVolumeBNB += event.args.bnbAmount;
    });

    // Sum sell volumes (use bnbReceived for actual BNB value)
    sellEvents.forEach((event) => {
      totalVolumeBNB += event.args.bnbReceived;
    });

    const volumeBNB = Number(ethers.formatEther(totalVolumeBNB));

    // Get current BNB price for USD conversion
    let volumeUSD = 0;
    try {
      const bnbPriceRaw = await sdk.priceOracle.getBNBPrice();
      const bnbPriceUSD = Number(bnbPriceRaw) / 1e8; // Price oracle returns 8 decimals
      volumeUSD = volumeBNB * bnbPriceUSD;
    } catch (error) {
      console.warn('Could not fetch BNB price for USD conversion:', error);
      // Fallback: assume BNB = $600
      volumeUSD = volumeBNB * 600;
    }

    return {
      volumeBNB,
      volumeUSD,
      buyCount: buyEvents.length,
      sellCount: sellEvents.length,
      lastUpdated: new Date()
    };

  } catch (error) {
    console.error('Error calculating 24h volume:', error);
    throw error;
  }
}

/**
 * Get 24h volume with caching
 */
export async function get24hVolumeWithCache(
  sdk: SafuPadSDK,
  tokenAddress: string
): Promise<number> {
  // Check cache
  const cached = volumeCache.get(tokenAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.volume;
  }

  // Calculate fresh
  const volumeData = await calculate24hVolume(sdk, tokenAddress);

  // Update cache
  volumeCache.set(tokenAddress, {
    volume: volumeData.volumeBNB,
    timestamp: Date.now()
  });

  return volumeData.volumeBNB;
}

/**
 * Clear volume cache for a specific token or all tokens
 */
export function clearVolumeCache(tokenAddress?: string): void {
  if (tokenAddress) {
    volumeCache.delete(tokenAddress);
  } else {
    volumeCache.clear();
  }
}

/**
 * Get cache status
 */
export function getCacheInfo(): {
  size: number;
  tokens: string[];
} {
  return {
    size: volumeCache.size,
    tokens: Array.from(volumeCache.keys())
  };
}