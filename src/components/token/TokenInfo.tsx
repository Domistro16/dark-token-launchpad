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

export function TokenInfo({ token }: TokenInfoProps) {
  const { sdk } = useSafuPadSDK();
  const { address } = useAccount();
  const [marketCapBnb, setMarketCapBnb] = useState<number>(0);
  const [targetCapBnb, setTargetCapBnb] = useState<number>(0);
  const [bnbReserve, setBnbReserve] = useState<number>(0);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <Image
            src={token.image}
            alt={token.name}
            width={80}
            height={80}
            className="rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{token.symbol}</h1>
              <Badge variant={token.graduated ? "default" : token.status === "pending" ? "secondary" : "outline"}>
                {token.graduated ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Graduated</>
                ) : (
                  token.status
                )}
              </Badge>
              <Badge variant="outline">
                {token.launchType === "project-raise" ? "Project Raise" : "Instant Launch"}
              </Badge>
            </div>
            <h2 className="text-xl text-muted-foreground mb-3">{token.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{token.description}</p>
            
            {/* Social Links */}
            <div className="flex gap-2">
              {token.twitter && (
                <Button variant="outline" size="sm" asChild className="controller-btn-outline">
                  <a href={token.twitter} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Twitter
                  </a>
                </Button>
              )}
              {token.telegram && (
                <Button variant="outline" size="sm" asChild className="controller-btn-outline">
                  <a href={token.telegram} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Telegram
                  </a>
                </Button>
              )}
              {token.website && (
                <Button variant="outline" size="sm" asChild className="controller-btn-outline">
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
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Contract:</span>
          <code className="text-sm font-mono flex-1">{formatAddress(token.contractAddress)}</code>
          <Button variant="ghost" size="sm" onClick={copyAddress} className="controller-btn-outline">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Price</span>
          </div>
          <p className="text-xl font-bold">{formatPrice(token.currentPrice)}</p>
          <p className={`text-sm ${token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatPercentage(token.priceChange24h)}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Market Cap</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(token.marketCap)}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(Number(ethers.formatUnits(token.liquidityPool, 18)))} liquidity
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">24h Volume</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(token.volume24h)}</p>
          <p className="text-sm text-muted-foreground">{token.transactions} txns</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Holders</span>
          </div>
          <p className="text-xl font-bold">{token.holders.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">
            {(token.totalSupply / 1000000).toFixed(2)}M supply
          </p>
        </Card>
      </div>

      {/* Project Raise Progress */}
      {token.launchType === "project-raise" && token.projectRaise && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Fundraise Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Raised</span>
                <span className="font-bold">
                  {formatCurrency(token.projectRaise.raisedAmount)} / {formatCurrency(token.projectRaise.targetAmount)}
                </span>
              </div>
              <Progress
                value={getProgressPercentage(token.projectRaise.raisedAmount, token.projectRaise.targetAmount)}
                className="h-3"
              />
            </div>
            {token.status === "active" && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Time Remaining</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {formatTimeRemaining(token.projectRaise.endTime)}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Project Raise Graduation Progress */}
      {token.launchType === "project-raise" && !token.graduated && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Graduation Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">To 15 BNB</span>
                <span className="font-bold">
                  {bnbReserve.toFixed(4)} BNB / 15 BNB
                </span>
              </div>
              <Progress
                value={getProgressPercentage(bnbReserve, 15)}
                className="h-3"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted-foreground">
                For this token to graduate, the pool must reach 15 BNB.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Instant Launch Progress */}
      {token.launchType === "instant-launch" && token.instantLaunch && !token.graduated && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Graduation Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">To 15 BNB</span>
                <span className="font-bold">
                  {bnbReserve.toFixed(7)} BNB / 15 BNB
                </span>
              </div>
              <Progress
                value={getProgressPercentage(bnbReserve, 15)}
                className="h-3"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted-foreground">
                For this token to graduate, the pool must reach 15 BNB.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Graduation Info */}
      {token.graduated && (
        <Card className="p-6 bg-primary/10 border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold">Token Graduated!</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            This token has graduated to PancakeSwap and can be traded on both platforms.
          </p>
          {token.graduationDate && (
            <p className="text-xs text-muted-foreground">
              Graduated on {token.graduationDate.toLocaleDateString()}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}