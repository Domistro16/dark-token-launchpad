"use client";

import { Token } from "@/types/token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatCurrency,
  formatPercentage,
  formatAddress,
  formatTimeRemaining,
  getProgressPercentage,
  formatPrice
} from "@/lib/utils/format";
import {
  ExternalLink,
  Copy,
  Clock,
  TrendingUp,
  Users,
  Activity,
  Rocket,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import {ethers} from "ethers";
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface TokenInfoProps {
  token: Token;
}

// Generate consistent gradient based on token ID
function generateGradient(id: string, symbol: string) {
  const colors = ['#FFB000', '#ff6b00', '#ffd700', '#ff8c00', '#ffaa00'];
  const hash = (id + symbol).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color1 = colors[hash % colors.length];
  const color2 = colors[(hash + 3) % colors.length];
  const angle = (hash % 360);
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}

export function TokenInfo({ token }: TokenInfoProps) {
  const { sdk } = useSafuPadSDK();
  const { address } = useAccount();
  const [marketCapBnb, setMarketCapBnb] = useState<number>(0);
  const [targetCapBnb, setTargetCapBnb] = useState<number>(0);
  const [bnbReserve, setBnbReserve] = useState<number>(0);
  const [imageError, setImageError] = useState(false);
  const [isInvalidUrl, setIsInvalidUrl] = useState(false);

  // Check if URL is valid on mount
  useEffect(() => {
    if (token.image && !token.image.startsWith('http://') && !token.image.startsWith('https://')) {
      setIsInvalidUrl(true);
    }
  }, [token.image]);

  useEffect(() => {
    const fetchPoolInfo = async () => {
      if (!sdk) return;
      
      try {
        // Fetch pool info to get bnbReserve
        const poolInfo = await sdk.bondingDex.getPoolInfo(token.id);
        const reserve = Number(ethers.formatEther(poolInfo.bnbReserve));
        setBnbReserve(reserve);
        
        // Convert current market cap to BNB
        const currentBnb = await sdk.priceOracle.usdToBNB(
          ethers.parseEther(token.marketCap.toString())
        );
        
        setMarketCapBnb(Number(ethers.formatEther(currentBnb)));
      } catch (error) {
        console.error("Error fetching pool info:", error);
      }
    };

    void fetchPoolInfo();
  }, [sdk, token.id, token.marketCap]);

  const copyAddress = () => {
    navigator.clipboard.writeText(token.contractAddress);
    alert("Contract address copied!");
  };

  const shouldShowGradient = imageError || isInvalidUrl;

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <Card className="p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
          {shouldShowGradient ? (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: generateGradient(token.id, token.symbol) }}
            >
              <span className="text-3xl font-black text-background">
                {token.symbol.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <Image
              src={token.image}
              alt={token.name}
              width={80}
              height={80}
              className="rounded-full flex-shrink-0"
              onError={() => setImageError(true)}
            />
          )}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold break-words">{token.symbol}</h1>
              <Badge variant={token.graduated ? "default" : token.status === "pending" ? "secondary" : "outline"} className="whitespace-nowrap">
                {token.graduated ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Graduated</>
                ) : (
                  token.status
                )}
              </Badge>
              <Badge variant="outline" className="whitespace-nowrap">
                {token.launchType === "project-raise" ? "Project Raise" : "Instant Launch"}
              </Badge>
            </div>
            <h2 className="text-lg md:text-xl text-muted-foreground mb-3 break-words">{token.name}</h2>
            <p className="text-sm text-muted-foreground mb-4 break-words">{token.description}</p>
            
            {/* Founder Address */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 rounded-lg">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Founder:</span>
              <code className="text-xs font-mono text-accent">{formatAddress(token.creatorAddress)}</code>
            </div>
            
            {/* Social Links */}
            <div className="flex flex-wrap gap-2">
              {token.twitter && (
                <Button variant="outline" size="sm" asChild className="controller-btn-outline flex-shrink-0">
                  <a href={token.twitter} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Twitter
                  </a>
                </Button>
              )}
              {token.telegram && (
                <Button variant="outline" size="sm" asChild className="controller-btn-outline flex-shrink-0">
                  <a href={token.telegram} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Telegram
                  </a>
                </Button>
              )}
              {token.website && (
                <Button variant="outline" size="sm" asChild className="controller-btn-outline flex-shrink-0">
                  <a href={token.website} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Contract Address */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg overflow-hidden">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Contract:</span>
          <code className="text-sm font-mono flex-1 truncate">{formatAddress(token.contractAddress)}</code>
          <Button variant="ghost" size="sm" onClick={copyAddress} className="controller-btn-outline flex-shrink-0">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Price</span>
          </div>
          <p className="text-lg md:text-xl font-bold truncate">{formatPrice(token.currentPrice)}</p>
          <p className={`text-sm ${token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"} truncate`}>
            {formatPercentage(token.priceChange24h)}
          </p>
        </Card>

        <Card className="p-3 md:p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Market Cap</span>
          </div>
          <p className="text-lg md:text-xl font-bold truncate">{formatCurrency(token.marketCap)}</p>
          <p className="text-sm text-muted-foreground truncate">
            {formatCurrency(Number(ethers.formatUnits(token.liquidityPool, 18)))} liquidity
          </p>
        </Card>

        <Card className="p-3 md:p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">24h Volume</span>
          </div>
          <p className="text-lg md:text-xl font-bold truncate">{formatCurrency(token.volume24h)}</p>
          <p className="text-sm text-muted-foreground truncate">{token.transactions} txns</p>
        </Card>

        <Card className="p-3 md:p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Holders</span>
          </div>
          <p className="text-lg md:text-xl font-bold truncate">{token.holders.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground truncate">
            {(token.totalSupply / 1000000000).toFixed(2)}B supply
          </p>
        </Card>
      </div>

      {/* Project Raise Progress */}
      {token.launchType === "project-raise" && token.projectRaise && (
        <Card className="p-4 md:p-6 overflow-hidden">
          <h3 className="text-base md:text-lg font-bold mb-4">Fundraise Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap justify-between text-sm mb-2 gap-2">
                <span className="text-muted-foreground">Raised</span>
                <span className="font-bold break-words">
                  {formatCurrency(token.projectRaise.raisedAmount)} / {formatCurrency(token.projectRaise.targetAmount)}
                </span>
              </div>
              <Progress
                value={getProgressPercentage(token.projectRaise.raisedAmount, token.projectRaise.targetAmount)}
                className="h-3"
              />
            </div>
            {token.status === "active" && (
              <div className="flex flex-wrap items-center justify-between p-3 bg-primary/10 rounded-lg gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">Time Remaining</span>
                </div>
                <span className="text-base md:text-lg font-bold text-primary whitespace-nowrap">
                  {formatTimeRemaining(token.projectRaise.endTime)}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Project Raise Graduation Progress */}
      {token.launchType === "project-raise" && !token.graduated && (
        <Card className="p-4 md:p-6 overflow-hidden">
          <h3 className="text-base md:text-lg font-bold mb-4">Graduation Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap justify-between text-sm mb-2 gap-2">
                <span className="text-muted-foreground">To 15 BNB</span>
                <span className="font-bold break-words">
                  {bnbReserve.toFixed(4)} BNB / 15 BNB
                </span>
              </div>
              <Progress
                value={getProgressPercentage(bnbReserve, 15)}
                className="h-3"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted-foreground break-words">
                For this token to graduate, the pool must reach 15 BNB.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Instant Launch Progress */}
      {token.launchType === "instant-launch" && token.instantLaunch && !token.graduated && (
        <Card className="p-4 md:p-6 overflow-hidden">
          <h3 className="text-base md:text-lg font-bold mb-4">Graduation Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap justify-between text-sm mb-2 gap-2">
                <span className="text-muted-foreground">To 15 BNB</span>
                <span className="font-bold break-words">
                  {bnbReserve.toFixed(7)} BNB / 15 BNB
                </span>
              </div>
              <Progress
                value={getProgressPercentage(bnbReserve, 15)}
                className="h-3"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted-foreground break-words">
                For this token to graduate, the pool must reach 15 BNB.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Graduation Info */}
      {token.graduated && (
        <Card className="p-4 md:p-6 bg-primary/10 border-primary/20 overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
            <h3 className="text-base md:text-lg font-bold">Token Graduated!</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2 break-words">
            This token has graduated to PancakeSwap and can be traded on both platforms.
          </p>
          {token.graduationDate && (
            <p className="text-xs text-muted-foreground break-words">
              Graduated on {token.graduationDate.toLocaleDateString()}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}