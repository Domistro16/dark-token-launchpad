"use client";

import { Header } from "@/components/Header";
import { TokenCard } from "@/components/TokenCard";
import { mockTokens } from "@/lib/mockData";
import { Coins, Trophy, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import type { Token } from "@/types/token";
import { ethers } from "ethers";
import { ContributeModal } from "@/components/ContributeModal";
import { TokensLoadingAnimation } from "@/components/TokensLoadingAnimation";

export default function Home() {
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contributeToken, setContributeToken] = useState<Token | null>(null);
  const { sdk } = useSafuPadSDK();
  const [liveTokens, setLiveTokens] = useState<Token[] | null>(null);

  const handleContribute = (token: Token) => {
    console.log('handleContribute called with token:', token.id, token.name);
    setContributeToken(token);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!sdk) {
        setLoading(true);
        return;
      }
      console.log('b')
      setLoading(true);
      setLoadError(null);
      
      try {
        // Step 1: Get all token addresses - Use correct SDK method
        const addresses = await sdk.launchpad.getAllLaunches();
        console.log(addresses)
        if (cancelled) return;

        // Step 2: For each token address, fetch details
        const items: Token[] = await Promise.all(
          addresses.map(async (addr: string, idx: number): Promise<Token> => {
            try {
              // A. Token Details - Use correct SDK method
              const tokenInfo = await sdk.tokenFactory.getTokenInfo(addr);
              
              // ✅ FIX: metadata is already an object, not a promise
              const tokenMeta = tokenInfo.metadata;
              console.log(tokenInfo)
              // ✅ FIX: Never show address as name
              const tokenName = tokenInfo.name || "Unknown Token";
              const tokenSymbol = tokenInfo.symbol || "???";
              
              // ✅ FIX: Use correct field name 'logoURI' not 'logo'
              const logoURI = tokenMeta.logoURI || 
                "https://www.rmg.co.uk/sites/default/files/styles/full_width_1440/public/Color-Full%20Moon%20%C2%A9%20Nicolas%20Lefaudeux.jpg.webp?itok=ghLyCuO0";

              // B. Launch Information - Use correct SDK method
              const launchInfo = await sdk.launchpad.getLaunchInfoWithUSD(addr);

              // C. Pool Information - Use correct SDK method
              const poolInfo = await sdk.bondingDex.getPoolInfo(addr);
              
              // D. Get Vesting Information using sdk.launchpad.getLaunchVesting()
              let vestingData = null;
              try {
                vestingData = await sdk.launchpad.getLaunchVesting(addr);
                console.log(`Vesting info for ${tokenName}:`, vestingData);
              } catch (err) {
                console.warn(`Could not fetch vesting info for ${addr}:`, err);
              }
              
              // ✅ Get creator fee information using sdk.bondingDex.getCreatorFeeInfo()
              let creatorFeeInfo = null;
              try {
                creatorFeeInfo = await sdk.bondingDex.getCreatorFeeInfo(addr);
                console.log(`Creator fee info for ${tokenInfo.name}:`, creatorFeeInfo);
              } catch (err) {
                console.warn(`Could not fetch creator fee info for ${addr}:`, err);
              }
              
              console.log(`Pool info for ${tokenInfo.name}:`, poolInfo);

              // Parse launchType (0 = PROJECT-RAISE, 1 = INSTANT-LAUNCH)
              const launchTypeNum = Number(launchInfo.launchType);
              const isProjectRaise = launchTypeNum === 0;

              // Parse numeric values (handle BigNumber if needed)
            // ✅ CORRECT: Convert BigNumbers from wei (18 decimals) to regular numbers
              const totalRaisedUSD = Number(ethers.formatEther(launchInfo.totalRaisedUSD));
              const raiseMaxUSD = Number(ethers.formatEther(launchInfo.raiseMaxUSD));
              const marketCapUSD = Number(ethers.formatEther(poolInfo.marketCapUSD));
              const currentPrice = Number(ethers.formatEther(await sdk.priceOracle.bnbToUSD(poolInfo.currentPrice)));
              const graduationProgress = Number(poolInfo.graduationProgress);
              const priceMultiplier = Number(poolInfo.priceMultiplier);
              const raiseCompleted = Boolean(launchInfo.raiseCompleted);
              const graduated = Boolean(poolInfo.graduated);
              
              // Parse vesting data if available
              const startMarketCap = vestingData
                ? Number(ethers.formatEther(vestingData.startMarketCap))
                : 0;
              const vestingDuration = vestingData?.vestingDuration
                ? Number(vestingData.vestingDuration)
                : 0;
              const vestingStartTime = vestingData?.vestingStartTime
                ? new Date(Number(vestingData.vestingStartTime) * 1000)
                : null;
              const founderTokens = vestingData
                ? Number(ethers.formatEther(vestingData.founderTokens))
                : 0;
              const founderTokensClaimed = vestingData
                ? Number(ethers.formatEther(vestingData.founderTokensClaimed))
                : 0;
              
              // Parse creator fee info if available
              const accumulatedFees = creatorFeeInfo 
                ? Number(ethers.formatEther(creatorFeeInfo.accumulatedFees))
                : 0;
              const lastClaimTime = creatorFeeInfo?.lastClaimTime 
                ? new Date(Number(creatorFeeInfo.lastClaimTime) * 1000)
                : null;
              const graduationMarketCap = creatorFeeInfo
                ? Number(ethers.formatEther(creatorFeeInfo.graduationMarketCap))
                : 0;
              const currentMarketCapFromFee = creatorFeeInfo
                ? Number(ethers.formatEther(creatorFeeInfo.currentMarketCap))
                : marketCapUSD;
              const bnbInPool = creatorFeeInfo
                ? Number(ethers.formatEther(creatorFeeInfo.bnbInPool))
                : Number(poolInfo.bnbReserve);
              const canClaim = creatorFeeInfo?.canClaim ?? false;

              // Parse deadline
              const raiseDeadline = launchInfo.raiseDeadline
                ? new Date(Number(launchInfo.raiseDeadline) * 1000)
                : new Date(Date.now() + 24 * 60 * 60 * 1000);

              // D. Fetch volume data using new SDK methods
              let volume24h = 0;
              let totalVolumeBNB = 0;
              let recentTradesCount = 0;
              let holderCount = 0;
              let transactionCount = 0;
              let priceChange24h = 0;
                
            
              try {
                // Get 24h volume
                const volume24hData = await sdk.bondingDex.get24hVolume(addr);
                const volume24hBNB = volume24hData.volumeBNB;
             
                const vol = await sdk.priceOracle.bnbToUSD(Number(volume24hBNB));
                volume24h = ethers.formatUnits(Number(vol).toString(), 18);
                
                // Get total volume
                const totalVolumeData = await sdk.bondingDex.getTotalVolume(addr);
                totalVolumeBNB = Number(ethers.formatEther(totalVolumeData.totalVolumeBNB));

                transactionCount = totalVolumeData.buyCount + totalVolumeData.sellCount;
                
                // Get recent trades
                const recentTrades = await sdk.bondingDex.getRecentTrades(addr);
                recentTradesCount = recentTrades.length;
                
                // Get holder count
                holderCount = await sdk.bondingDex.getEstimatedHolderCount(addr);
                
                // Get 24h price change
                try {
                  const priceChangeData = await sdk.bondingDex.get24hPriceChange(addr);
                  priceChange24h = priceChangeData.priceChangePercent;
                  console.log(`Price change for ${tokenName}: ${priceChange24h}%`);
                } catch (error) {
                  console.warn(`Could not fetch price change data for ${addr}:`, error);
                }
                
                console.log(`Volume data for ${tokenName}:`, {
                  volume24h,
                  totalVolumeBNB,
                  recentTradesCount,
                  holderCount,
                  priceChange24h,
                  volume24hData,
                  totalVolumeData
                });
              } catch (error) {
                console.warn(`Could not fetch volume/holder data for ${addr}:`, error);
              }

              const token: Token = {
                id: addr,
                name: tokenName, // ✅ Correct: never shows address
                symbol: tokenSymbol,
                description: tokenMeta.description || "Launched token on SafuPad",
                image: logoURI,
                contractAddress: addr,
                creatorAddress: launchInfo.founder,
                
                launchType: isProjectRaise ? "project-raise" : "instant-launch",
                
                status: ((): Token["status"] => {
                  if (graduated) return "completed";
                  if (isProjectRaise && !raiseCompleted) return "active"; // Raising
                  return "active"; // Trading
                })(),
                
                createdAt: new Date(),

                // Financial
                totalSupply: Number(tokenInfo.totalSupply),
                currentPrice,
                marketCap: marketCapUSD,
                liquidityPool: Number(poolInfo.bnbReserve),
                volume24h,
                priceChange24h: priceChange24h,

                // Project Raise
                projectRaise: isProjectRaise ? {
                  config: {
                    type: "project-raise",
                    targetAmount: raiseMaxUSD || 0,
                    raiseWindow: 24 * 60 * 60 * 1000,
                    ownerAllocation: 20,
                    immediateUnlock: 10,
                    vestingMonths: 6,
                    liquidityAllocation: 10,
                    liquidityCap: 100000,
                    graduationThreshold: 500000,
                    tradingFee: { platform: 0.1, liquidity: 0.3, infofiPlatform: 0.6 },
                  },
                  raisedAmount: totalRaisedUSD,
                  targetAmount: raiseMaxUSD || 0,
                  startTime: new Date(Date.now() - 60_000),
                  endTime: raiseDeadline,
                  vestingSchedule: { 
                    totalAmount: founderTokens, 
                    releasedAmount: founderTokensClaimed, 
                    schedule: [] 
                  },
                  approved: true,
                  // Vesting data from SDK
                  vestingData: vestingData ? {
                    startMarketCap,
                    vestingDuration,
                    vestingStartTime,
                    founderTokens,
                    founderTokensClaimed,
                  } : undefined,
                } : undefined,

                // Instant Launch
                instantLaunch: !isProjectRaise ? {
                  config: {
                    type: "instant-launch",
                    tradingFee: { platform: 0.1, creator: 1.0, infofiPlatform: 0.9 },
                    graduationThreshold: 15,
                    claimCooldown: 86_400_000,
                    marketCapRequirement: true,
                    accrualPeriod: 604_800_000,
                  },
                  cumulativeBuys: bnbInPool,
                  creatorFees: accumulatedFees,
                  lastClaimTime: lastClaimTime,
                  claimableAmount: canClaim ? accumulatedFees : 0,
                  graduationProgress,
                  priceMultiplier,
                  graduationMarketCap,
                  canClaim,
                } as any : undefined,

                // Graduation
                graduated,
                graduationDate: graduated ? new Date() : undefined,
                startingMarketCap: startMarketCap,

                // Social - Use correct field names
                twitter: tokenMeta.twitter,
                telegram: tokenMeta.telegram,
                website: tokenMeta.website,

                // Stats - Updated with SDK data
                holders: holderCount,
                transactions: transactionCount,
                
                // Keep index for sorting
                __index: idx,
              } as Token;

              return token;
              
            } catch (err) {
              console.error(`Error fetching token ${addr}:`, err);
              // Return minimal fallback on error
              return {
                id: addr,
                name: "Error Loading Token",
                symbol: "ERR",
                description: "Failed to load token data",
                image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c1?w=400&h=400&fit=crop",
                contractAddress: addr,
                creatorAddress: "0x0000000000000000000000000000000000000000",
                status: "active",
                launchType: "instant-launch",
                createdAt: new Date(),
                totalSupply: 0,
                currentPrice: 0,
                marketCap: 0,
                liquidityPool: 0,
                volume24h: 0,
                priceChange24h: 0,
                graduated: false,
                holders: 0,
                transactions: 0,
                __index: idx,
              } as Token;
            }
          })
        );

        if (cancelled) return;
        setLiveTokens(items);

        
      } catch (e: any) {
        console.error("Error loading launches:", e);
        if (!cancelled) setLoadError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Initial load
    void load();

    return () => {
      cancelled = true;
    };
  }, [sdk]);

  const tokens = liveTokens || [];

  const filteredTokens = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list: any[] = tokens;

    // Filtering
    if (filterBy === "project") list = list.filter((t) => t.launchType === "project-raise");
    if (filterBy === "instant") list = list.filter((t) => t.launchType === "instant-launch");
    if (filterBy === "activeRaises")
      list = list.filter((t) => t.launchType === "project-raise" && t.status === "active");
    if (filterBy === "trading") list = list.filter((t) => t.graduated === false);
    if (filterBy === "graduated") list = list.filter((t) => t.graduated === true);

    // Search
    if (q) {
      list = list.filter((t) => {
        const name = String(t?.name || "").toLowerCase();
        const symbol = String(t?.symbol || "").toLowerCase();
        const id = String(t?.id || "").toLowerCase();
        return name.includes(q) || symbol.includes(q) || id.includes(q);
      });
    }

    // Sorting
    list = [...list];
    if (sortBy === "newest") {
      list.sort((a, b) => (b.__index ?? 0) - (a.__index ?? 0));
    } else if (sortBy === "marketCap") {
      list.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
    } else if (sortBy === "progress") {
      list.sort((a, b) => {
        const pa = a.launchType === "instant-launch" 
          ? a.instantLaunch?.graduationProgress ?? 0 
          : (a.projectRaise ? (a.projectRaise.raisedAmount / (a.projectRaise.targetAmount || 1)) * 100 : 0);
        const pb = b.launchType === "instant-launch" 
          ? b.instantLaunch?.graduationProgress ?? 0 
          : (b.projectRaise ? (b.projectRaise.raisedAmount / (b.projectRaise.targetAmount || 1)) * 100 : 0);
        return pb - pa;
      });
    } else if (sortBy === "endingSoon") {
      list.sort((a, b) => {
        const ea = a.launchType === "project-raise" 
          ? a.projectRaise?.endTime?.getTime?.() ?? Infinity 
          : Infinity;
        const eb = b.launchType === "project-raise" 
          ? b.projectRaise?.endTime?.getTime?.() ?? Infinity 
          : Infinity;
        return ea - eb;
      });
    }

    return list;
  }, [search, tokens, filterBy, sortBy]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-24 md:pb-0">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-14 sm:py-16 relative">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-wide md:tracking-wider glow-text break-words">
              ICM 2.0 on BNB Chain
            </h1>
            
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/create">
                <button className="controller-btn flex items-center gap-2">
                  <Coins className="w-6 h-6" />
                  Start Mission
                </button>
              </Link>
              <button className="controller-btn-outline controller-btn flex items-center gap-2">
                <Trophy className="w-6 h-6 text-accent" />
                View Leaderboard
              </button>
            </div>
            
            {loading && (
              <p className="text-xs text-accent/80">Loading launches…</p>
            )}
            {!loading && liveTokens && (
              <p className="text-xs text-accent/80">
                Showing {liveTokens.length} live launch{liveTokens.length === 1 ? "" : "es"} from SDK
              </p>
            )}
            {!loading && loadError && (
              <p className="text-xs text-destructive">
                Live launches unavailable. Showing sample data.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Tokens Grid */}
      <section id="tokens" className="container mx-auto px-4 pb-12 pt-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black mb-1">Tokens</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tokens by name or symbol..."
                className="pl-10"
              />
            </div>
            
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="bg-card/70 border-2 border-primary/30 px-3 py-2 rounded-md"
            >
              <option value="all">All Tokens</option>
              <option value="project">Project Raises</option>
              <option value="instant">Instant Launches</option>
              <option value="activeRaises">Active Raises</option>
              <option value="trading">Trading</option>
              <option value="graduated">Graduated</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-card/70 border-2 border-primary/30 px-3 py-2 rounded-md"
            >
              <option value="newest">Newest First</option>
              <option value="marketCap">Highest Market Cap</option>
              <option value="progress">Most Progress</option>
              <option value="endingSoon">Ending Soon</option>
            </select>
          </div>
        </div>

        {/* Loading Animation or Grid */}
        {loading ? (
          <TokensLoadingAnimation />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
            {filteredTokens.map((token: any) => (
              <TokenCard 
                key={token.id} 
                token={token} 
                onContribute={() => handleContribute(token)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-12 bg-card/30 backdrop-blur-sm relative overflow-hidden">
        <div className="container mx-auto px-4 py-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-accent/80 font-semibold tracking-wide">
              © 2024 InfoFi Launch
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-sm">
              <a href="#" className="text-accent/90 hover:text-accent underline-offset-4 hover:underline transition-colors">
                Docs
              </a>
              <a href="#" className="text-accent/90 hover:text-accent underline-offset-4 hover:underline transition-colors">
                Twitter
              </a>
              <a href="#" className="text-accent/90 hover:text-accent underline-offset-4 hover:underline transition-colors">
                Telegram
              </a>
              <a href="#" className="text-accent/90 hover:text-accent underline-offset-4 hover:underline transition-colors">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Contribute Modal */}
      <ContributeModal
        token={contributeToken}
        isOpen={!!contributeToken}
        onClose={() => setContributeToken(null)}
      />
    </div>
  );
}