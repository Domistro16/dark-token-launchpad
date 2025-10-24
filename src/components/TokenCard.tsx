"use client";

import { Token } from "@/types/token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  formatCurrency, 
  formatPercentage, 
  formatPrice, 
  formatTimeRemaining,
  getProgressPercentage 
} from "@/lib/utils/format";
import { Clock, TrendingUp, Users, ExternalLink, DollarSign } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { getTokenStats, type PancakeSwapStats } from "@/lib/utils/pancakeswap";

interface TokenCardProps {
  token: Token;
  onContribute?: () => void;
}

// Generate a consistent gradient based on token ID/name
function generateGradient(seed: string): string {
  const colors = [
    ['#FFB000', '#ff6b00'],
    ['#ffd700', '#FFB000'],
    ['#ff8c00', '#ff6b00'],
    ['#FFB000', '#ffaa00'],
    ['#ff6b00', '#ff0055'],
    ['#ffd700', '#ff8c00'],
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % colors.length;
  const angle = (Math.abs(hash) % 360);
  
  return `linear-gradient(${angle}deg, ${colors[index][0]}, ${colors[index][1]})`;
}

export function TokenCard({ token, onContribute }: TokenCardProps) {
  const { sdk } = useSafuPadSDK();
  const { address: userAddress } = useAccount();
  const [bnbReserve, setBnbReserve] = useState<number>(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [bnbRaised, setBnbRaised] = useState<number>(0);
  const [bnbTarget, setBnbTarget] = useState<number>(0);
  const [pancakeSwapStats, setPancakeSwapStats] = useState<PancakeSwapStats | null>(null);
  const [graduatedToPancakeSwap, setGraduatedToPancakeSwap] = useState(false);
  
  const isProjectRaise = token.launchType === "project-raise";
  const isGraduated = token.graduated;

  // Check if image URL is valid
  const isValidImageUrl = token.image && 
    (token.image.startsWith('http://') || 
     token.image.startsWith('https://') || 
     token.image.startsWith('/'));

  const shouldShowGradient = !isValidImageUrl || imageError;
  const gradient = generateGradient(token.id + token.symbol);

  // Fetch graduation status
  useEffect(() => {
    const fetchGraduationStatus = async () => {
      if (!sdk || !isGraduated) return;
      
      try {
        const launchInfo = await sdk.launchpad.getLaunchInfo(token.id);
        setGraduatedToPancakeSwap(Boolean(launchInfo.graduatedToPancakeSwap));
      } catch (error) {
        console.error("Error fetching graduation status:", error);
      }
    };

    void fetchGraduationStatus();
  }, [sdk, token.id, isGraduated]);

  // Fetch PancakeSwap stats if graduated
  useEffect(() => {
    const fetchPancakeSwapStats = async () => {
      if (!isGraduated || !graduatedToPancakeSwap) return;
      
      try {
        const provider = new ethers.JsonRpcProvider("https://bnb-testnet.g.alchemy.com/v2/tTuJSEMHVlxyDXueE8Hjv");
        const stats = await getTokenStats(token.id, provider);
        setPancakeSwapStats(stats);
      } catch (error) {
        console.error("Error fetching PancakeSwap stats:", error);
      }
    };

    void fetchPancakeSwapStats();
  }, [token.id, isGraduated, graduatedToPancakeSwap]);

  // Fetch BNB reserve for graduation progress
  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (!sdk || isGraduated) return;
      
      try {
        const poolInfo = await sdk.bondingDex.getPoolInfo(token.id);
        const reserve = Number(ethers.formatEther(poolInfo.bnbReserve));
        setBnbReserve(reserve);
      } catch (error) {
        console.error("Error fetching pool info:", error);
      }
    };

    void fetchPoolInfo();
  }, [sdk, token.id, isGraduated]);

  // Convert USD raise values to BNB for Project Raise tokens
  useEffect(() => {
    const convertToBnb = async () => {
      if (!sdk || !isProjectRaise || !token.projectRaise) return;
      
      try {
        const raisedBNB = await sdk.priceOracle.usdToBNB(
          ethers.parseEther(token.projectRaise.raisedAmount.toString())
        );
        const targetBNB = await sdk.priceOracle.usdToBNB(
          ethers.parseEther(token.projectRaise.targetAmount.toString())
        );
        
        setBnbRaised(Number(ethers.formatEther(raisedBNB)));
        setBnbTarget(Number(ethers.formatEther(targetBNB)));
      } catch (error) {
        console.error("Error converting to BNB:", error);
      }
    };

    void convertToBnb();
  }, [sdk, isProjectRaise, token.projectRaise]);

  // Use PancakeSwap stats if available, otherwise use token stats
  const displayPrice = pancakeSwapStats ? pancakeSwapStats.priceInUSD : token.currentPrice;
  const displayMarketCap = pancakeSwapStats ? pancakeSwapStats.marketCapUSD : token.marketCap;
  
  // Handle liquidityPool - it might be a number, BigInt, or bigint string
  const getDisplayLiquidity = () => {
    if (pancakeSwapStats) return pancakeSwapStats.liquidityUSD;
    
    if (!token.liquidityPool) return 0;
    
    // If it's already a number, return it
    if (typeof token.liquidityPool === 'number') return token.liquidityPool;
    
    // If it's a BigInt or string, format it
    try {
      return Number(ethers.formatUnits(token.liquidityPool.toString(), 18));
    } catch (error) {
      console.error("Error formatting liquidity:", error);
      return 0;
    }
  };
  
  const displayLiquidity = getDisplayLiquidity();

  // Derive display status per spec
  const displayStatus = (() => {
    if (isProjectRaise && token.projectRaise) {
      const now = Date.now();
      const stillRaising = token.projectRaise.endTime && token.projectRaise.endTime.getTime() > now && (token.projectRaise.raisedAmount ?? 0) < (token.projectRaise.targetAmount || 0);
      if (stillRaising) return "Raising";
      if (isGraduated) return "Graduated";
      return "Trading";
    }
    return isGraduated ? "Graduated" : "Trading";
  })();
  const isRaising = displayStatus === "Raising";
  
  return (
    <div className="bg-card/70 border-2 border-primary/30 pixel-corners hover:border-primary/60 transition-all hover:shadow-xl glow-effect flex h-full flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start gap-3">
          <Link href={`/token/${token.id}`} className="cursor-pointer">
            {shouldShowGradient ? (
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-background/90 hover:scale-105 transition-transform"
                style={{ background: gradient }}
              >
                {token.symbol.charAt(0).toUpperCase()}
              </div>
            ) : (
              <Image
                src={token.image}
                alt={token.name}
                width={56}
                height={56}
                className="rounded-full hover:scale-105 transition-transform"
                onError={() => setImageError(true)}
                onLoad={() => setImageLoading(false)}
              />
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/token/${token.id}`} className="cursor-pointer block">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg hover:text-primary transition-colors">{token.symbol}</h3>
                <Badge variant={isGraduated ? "default" : token.status === "pending" ? "secondary" : "outline"}>
                  {displayStatus}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate hover:text-accent transition-colors">{token.name}</p>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {isProjectRaise ? "Project Raise" : "Instant Launch"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3 flex-1">
        {/* Creator Fee Banner for Instant Launch */}
        {!isProjectRaise && token.instantLaunch && (
          <div className="bg-primary/10 border border-primary/30 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary">Creator Fees</span>
              </div>
              {token.instantLaunch.canClaim && (
                <Badge variant="default" className="text-xs">
                  Claimable
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Accumulated:</span>
                <span className="font-medium">{formatCurrency(token.instantLaunch.creatorFees)}</span>
              </div>
              {token.instantLaunch.lastClaimTime && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Last Claim:</span>
                  <span className="font-medium">
                    {new Date(token.instantLaunch.lastClaimTime).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price & Market Cap */}
        {!(isProjectRaise && isRaising) && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Price</p>
              <p className="text-sm font-bold">{formatPrice(displayPrice)}</p>
              <p className={`text-xs ${token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatPercentage(token.priceChange24h)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
              <p className="text-sm font-bold">{formatCurrency(displayMarketCap)}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(displayLiquidity)} Vol</p>
            </div>
          </div>
        )}

        {/* Project Raise Progress */}
        {isProjectRaise && token.projectRaise && isRaising && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Raise Progress</span>
              <span className="font-medium">
                {bnbRaised.toFixed(4)} BNB / {bnbTarget.toFixed(4)} BNB
              </span>
            </div>
            <Progress 
              value={getProgressPercentage(token.projectRaise.raisedAmount, token.projectRaise.targetAmount)} 
              className="h-2"
            />
            {displayStatus === "Raising" && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatTimeRemaining(token.projectRaise.endTime)} left</span>
              </div>
            )}
          </div>
        )}

        {/* Graduation Progress - For both Project Raise and Instant Launch */}
        {!isGraduated && !isRaising && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Graduation Progress</span>
              <span className="font-medium">
                {bnbReserve.toFixed(4)} BNB / 15 BNB
              </span>
            </div>
            <Progress 
              value={getProgressPercentage(bnbReserve, 15)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              Pool must reach 15 BNB to graduate to PancakeSwap
            </p>
          </div>
        )}

        {/* Additional Stats - Using SDK data passed from parent */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">{token.holders || 0} holders</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">{token.transactions || 0} txns</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        {isRaising ? (
          <Button className="controller-btn w-full" onClick={onContribute}>
            Contribute
          </Button>
        ) : (
          <Link href={`/token/${token.id}`}>
            <Button className="controller-btn w-full">Trade Now</Button>
          </Link>
        )}
        <div className="flex gap-2">
          {token.twitter && (
            <Button size="sm" className="controller-btn-outline arcade-btn flex-1" asChild>
              <a href={token.twitter} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                Twitter
              </a>
            </Button>
          )}
          {token.website && (
            <Button size="sm" className="controller-btn-outline arcade-btn flex-1" asChild>
              <a href={token.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                Website
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}