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

export default function Home() {
  const [search, setSearch] = useState("");
  const { sdk } = useSafuPadSDK();
  const [liveTokens, setLiveTokens] = useState<Token[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "marketCap" | "progress" | "endingSoon">("newest");
  const [filterBy, setFilterBy] = useState<
    "all" | "project" | "instant" | "activeRaises" | "trading" | "graduated"
  >("all");

  useEffect(() => {
    let cancelled = false;
    let interval: NodeJS.Timer | null = null;

    const load = async () => {
      if (!sdk) return;
      setLoading(true);
      setLoadError(null);
      try {
        // Step 1: Get all token addresses
        const launches: any[] =
          (await (sdk as any).launchpadManager?.getAllLaunches?.()) ??
          (await (sdk as any).launchpad?.getAllLaunches?.());

        const addresses: string[] = (launches || [])
          .map((l: any) => (typeof l === "string" ? l : l?.tokenAddress || l?.address))
          .filter(Boolean);
        if (cancelled) return;

        // Step 2: For each token address, fetch details
        const items: Token[] = await Promise.all(
          addresses.map(async (addr: string, idx: number): Promise<Token> => {
            // A. Token Details
            const tokenInfo: any = await (sdk).tokenFactory?.getTokenInfo?.(addr)
              .catch(() => null)
              .then(async (t: any) => {
                if (!t && (sdk as any).getTokenInfo) {
                  return await (sdk as any).getTokenInfo(addr).catch(() => null);
                }
                return t;
              });
            const tokenMeta: any = tokenInfo?.metadata ? await tokenInfo.metadata.catch?.(() => null) ?? tokenInfo.metadata : null;
            const tokenName: string = tokenInfo?.name || tokenInfo?.token?.name || "";
            const tokenSymbol: string = tokenInfo?.symbol || tokenInfo?.token?.symbol || "";
            const logoURI: string = tokenMeta?.logo || tokenInfo?.image ||
              "https://images.unsplash.com/photo-1614064641938-3bbee52942c1?w=400&h=400&fit=crop";

            // B. Launch Information (with USD)
            const launchInfo: any =
              (await (sdk as any).launchpadManager?.getLaunchInfoWithUSD?.(addr).catch(() => null)) ??
              (await (sdk as any).launchpad?.getLaunchInfoWithUSD?.(addr).catch(() => null)) ??
              null;
            const fallbackLaunch: any =
              launchInfo ??
              (await (sdk as any).launchpadManager?.getLaunchInfo?.(addr).catch(() => null)) ??
              (await (sdk as any).launchpad?.getLaunchInfo?.(addr).catch(() => null));

            // C. Market/Pool Information
            const poolInfo: any = await ((sdk).bondingDex.getPoolInfo(addr)
              .catch(() => null) ?? null);
            const poolFallback: any = poolInfo ?? (await (sdk as any).bonding?.getPoolInfo(addr).catch(() => null));
            const pool = poolInfo ?? poolFallback ?? null;

            // Normalize launchType (can come as string or number). 0=PROJECT_RAISE, 1=INSTANT_LAUNCH
            const rawLaunchType = (fallbackLaunch as any)?.launchType;
            const launchTypeNum: number | undefined =
              rawLaunchType === undefined || rawLaunchType === null
                ? undefined
                : typeof rawLaunchType === "string"
                ? (isNaN(parseInt(rawLaunchType, 10)) ? undefined : parseInt(rawLaunchType, 10))
                : Number(rawLaunchType);

            // Infer project raise robustly with precedence:
            // 1) launchType === 0 => project
            // 2) launchType === 1 => instant
            // 3) If missing/ambiguous: presence of raise fields => project
            // 4) Lastly: if still unknown, no pool => project, else instant
            const hasRaiseFields = !!(
              (fallbackLaunch && (
                fallbackLaunch.raiseMaxUSD !== undefined ||
                fallbackLaunch.totalRaisedUSD !== undefined ||
                fallbackLaunch.raiseDeadline !== undefined ||
                fallbackLaunch.targetAmount !== undefined ||
                fallbackLaunch.raisedAmount !== undefined
              ))
            );
            const isProjectRaise =
              launchTypeNum === 0 ||
              (launchTypeNum === 1 ? false : hasRaiseFields) ||
              (launchTypeNum === undefined && !pool);

            // Derived common fields
            const currentPrice = Number(pool?.currentPrice ?? pool?.price ?? 0);
            const marketCapUSD = Number(pool?.marketCapUSD ?? pool?.marketCap ?? 0);
            const priceMultiplier = Number(pool?.priceMultiplier ?? 0);
            const graduationProgress = Number(pool?.graduationProgress ?? 0);
            const graduated = Boolean(pool?.graduated ?? false);

            // Project raise specifics
            const totalRaisedUSD = Number(fallbackLaunch?.totalRaisedUSD ?? fallbackLaunch?.raisedAmount ?? 0);
            const raiseMaxUSD = Number(fallbackLaunch?.raiseMaxUSD ?? fallbackLaunch?.targetAmount ?? 0);
            const raiseDeadline = fallbackLaunch?.raiseDeadline
              ? new Date(Number(fallbackLaunch.raiseDeadline))
              : fallbackLaunch?.endTime
              ? new Date(Number(fallbackLaunch.endTime))
              : undefined;
            const raiseCompleted = Boolean(fallbackLaunch?.raiseCompleted ?? false);

            const token: Token = {
              id: addr,
              name: tokenName || addr, // ensure name is not the address only if missing
              symbol: tokenSymbol || addr.slice(0, 4).toUpperCase(),
              description: tokenMeta?.description || tokenInfo?.description || "Launched token on SafuPad",
              image: logoURI,
              contractAddress: addr,
              creatorAddress:
                tokenInfo?.creator || tokenInfo?.owner || "0x0000000000000000000000000000000000000000",
              launchType: isProjectRaise ? "project-raise" : "instant-launch",
              status: ((): Token["status"] => {
                if (isProjectRaise) {
                  if (!raiseCompleted) return "active"; // Raising
                  if (raiseCompleted && !graduated) return "active"; // Trading after raise
                  return "completed"; // Graduated
                }
                return graduated ? "completed" : "active";
              })(),
              createdAt: tokenInfo?.createdAt ? new Date(Number(tokenInfo.createdAt)) : new Date(),

              // Financial
              totalSupply: Number(tokenInfo?.totalSupply ?? 0),
              currentPrice,
              marketCap: marketCapUSD,
              liquidityPool: Number(pool?.bnbReserve ?? pool?.liquidity ?? 0),
              volume24h: Number(pool?.volume24h ?? 0),
              priceChange24h: Number(pool?.priceChange24h ?? 0),

              // Project Raise
              projectRaise: isProjectRaise
                ? {
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
                      tradingFee: { platform: 0.1, academy: 0.3, infofiPlatform: 0.6 },
                    },
                    raisedAmount: totalRaisedUSD,
                    targetAmount: raiseMaxUSD || 0,
                    startTime: new Date(Date.now() - 60_000),
                    endTime: raiseDeadline ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
                    vestingSchedule: { totalAmount: 0, releasedAmount: 0, schedule: [] },
                    approved: true,
                  }
                : undefined,

              // Instant Launch
              instantLaunch: !isProjectRaise
                ? {
                    config: {
                      type: "instant-launch",
                      tradingFee: { platform: 0.1, creator: 1.0, infofiPlatform: 0.9 },
                      graduationThreshold: 15,
                      claimCooldown: 86_400_000,
                      marketCapRequirement: true,
                      accrualPeriod: 604_800_000,
                    },
                    cumulativeBuys: Number(pool?.bnbReserve ?? 0),
                    creatorFees: Number(pool?.creatorFees ?? 0),
                    lastClaimTime: pool?.lastClaimTime ? new Date(Number(pool.lastClaimTime)) : null,
                    claimableAmount: Number(pool?.claimableAmount ?? 0),
                    // extra fields used by card
                    graduationProgress,
                    priceMultiplier,
                  } as any
                : undefined,

              // Graduation
              graduated,
              graduationDate: pool?.graduationDate ? new Date(Number(pool.graduationDate)) : undefined,
              startingMarketCap: Number(tokenInfo?.startingMarketCap ?? 0),

              // Social
              twitter: tokenMeta?.twitter || tokenInfo?.twitter || undefined,
              telegram: tokenMeta?.telegram || tokenInfo?.telegram || undefined,
              website: tokenMeta?.website || tokenInfo?.website || undefined,

              // Stats
              holders: Number(pool?.holders ?? tokenInfo?.holders ?? 0),
              transactions: Number(pool?.transactions ?? 0),
              // keep index for sorting "newest"
              // @ts-ignore
              __index: idx,
            } as any;

            return token;
          })
        );

        setLiveTokens(items);
      } catch (e: any) {
        if (!cancelled) setLoadError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // initial load
    void load();
    // periodic refresh every 15s
    interval = setInterval(() => {
      void load();
    }, 15000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [sdk]);

  const tokens = liveTokens && liveTokens.length > 0 ? liveTokens : mockTokens;

  const filteredTokens = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list: any[] = tokens;

    // filtering
    if (filterBy === "project") list = list.filter((t) => t.launchType === "project-raise");
    if (filterBy === "instant") list = list.filter((t) => t.launchType === "instant-launch");
    if (filterBy === "activeRaises")
      list = list.filter((t) => t.launchType === "project-raise" && t.status === "active");
    if (filterBy === "trading") list = list.filter((t) => t.graduated === false);
    if (filterBy === "graduated") list = list.filter((t) => t.graduated === true);

    // search
    if (q) {
      list = list.filter((t) => {
        const name = String(t?.name || "").toLowerCase();
        const symbol = String(t?.symbol || "").toLowerCase();
        const id = String(t?.id || "").toLowerCase();
        return name.includes(q) || symbol.includes(q) || id.includes(q);
      });
    }

    // sorting
    list = [...list];
    if (sortBy === "newest") {
      list.sort((a, b) => (a.__index ?? 0) - (b.__index ?? 0)); // original order: newest last
      list.reverse();
    } else if (sortBy === "marketCap") {
      list.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
    } else if (sortBy === "progress") {
      list.sort((a, b) => {
        const pa = a.launchType === "instant-launch" ? a.instantLaunch?.graduationProgress ?? 0 : (a.projectRaise ? (a.projectRaise.raisedAmount / (a.projectRaise.targetAmount || 1)) * 100 : 0);
        const pb = b.launchType === "instant-launch" ? b.instantLaunch?.graduationProgress ?? 0 : (b.projectRaise ? (b.projectRaise.raisedAmount / (b.projectRaise.targetAmount || 1)) * 100 : 0);
        return pb - pa;
      });
    } else if (sortBy === "endingSoon") {
      list.sort((a, b) => {
        const ea = a.launchType === "project-raise" ? a.projectRaise?.endTime?.getTime?.() ?? Infinity : Infinity;
        const eb = b.launchType === "project-raise" ? b.projectRaise?.endTime?.getTime?.() ?? Infinity : Infinity;
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
              Welcome to Safupad
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
              <p className="text-xs text-accent/80">Showing {liveTokens.length} live launch{liveTokens.length === 1 ? "" : "es"} from SDK</p>
            )}
            {!loading && loadError && (
              <p className="text-xs text-destructive">Live launches unavailable. Showing sample data.</p>
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
          {filteredTokens.map((token: any) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
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
    </div>
  );
}