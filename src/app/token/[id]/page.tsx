"use client";

import { Header } from "@/components/Header";
import { TradingInterface } from "@/components/token/TradingInterface";
import { TokenInfo } from "@/components/token/TokenInfo";
import { VestingTimeline } from "@/components/token/VestingTimeline";
import { TradeHistory } from "@/components/token/TradeHistory";
import { mockTokens, mockTrades } from "@/lib/mockData";
import { notFound } from "next/navigation";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import { Wallet, Coins } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function TokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const token = mockTokens.find((t) => t.id === id);

  if (!token) {
    notFound();
  }

  const tokenTrades = mockTrades.filter((t) => t.tokenId === id);

  // Derive current user address from localStorage (placeholder until wallet/auth is wired)
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  useEffect(() => {
    try {
      const addr = localStorage.getItem("walletAddress");
      setCurrentAddress(addr);
    } catch {}
  }, []);

  const isCreator = useMemo(() => {
    if (!currentAddress) return false;
    return currentAddress.toLowerCase() === token.creatorAddress.toLowerCase();
  }, [currentAddress, token.creatorAddress]);

  const canClaim = token.graduated && isCreator;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Fees Banner - public visibility; claim button only for creator and when graduated */}
        {token.graduated && (
          <div className="mb-6 border-2 border-primary/40 bg-card/70 pixel-corners p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-accent" />
                <p className="text-sm text-muted-foreground">Creator Fees Accrued</p>
              </div>
              <p className="text-2xl font-black tracking-wide">
                {formatCurrency(token.instantLaunch?.creatorFees ?? 0)}
                <span className="ml-2 text-sm font-semibold text-muted-foreground">total</span>
              </p>
              {typeof token.instantLaunch?.claimableAmount === "number" && (
                <p className="text-xs text-muted-foreground">
                  Claimable now: <span className="font-semibold text-foreground">{formatCurrency(token.instantLaunch.claimableAmount)}</span>
                </p>
              )}
            </div>
            {canClaim && (
              <Button className="controller-btn" onClick={() => {/* wire claim action later */}}>
                <Wallet className="w-5 h-5 mr-2" />
                Claim Fees
              </Button>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Token Info & Chart */}
          <div className="lg:col-span-2 space-y-6">
            <TokenInfo token={token} />
            {token.projectRaise && (
              <VestingTimeline vestingSchedule={token.projectRaise.vestingSchedule} />
            )}
            <TradeHistory trades={tokenTrades} />
          </div>

          {/* Right Column - Trading Interface */}
          <div className="lg:col-span-1">
            <TradingInterface token={token} />
          </div>
        </div>
      </div>
    </div>
  );
}