"use client";

import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockTokens } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils/format";
import { Coins, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function PortfolioPage() {
  // Mock data - in real app, filter by connected wallet
  const userTokens = mockTokens.filter((t) => t.launchType === "instant-launch" || t.projectRaise?.approved);

  const totalPortfolioValue = userTokens.reduce((sum, token) => {
    return sum + (token.marketCap * 0.02); // Mock 2% holdings
  }, 0);

  const totalVolume24h = userTokens.reduce((sum, token) => {
    return sum + token.volume24h;
  }, 0);

  const averagePriceChange = userTokens.length > 0
    ? userTokens.reduce((sum, token) => sum + token.priceChange24h, 0) / userTokens.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">
            Manage your tokens and track your performance
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 pixel-corners border-2 border-primary/40">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Value</span>
            </div>
            <p className="text-3xl font-black tracking-wide mb-1">{formatCurrency(totalPortfolioValue)}</p>
            <p className="text-sm text-green-500 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +15.3% (24h)
            </p>
          </Card>

          <Card className="p-6 pixel-corners border-2 border-primary/40">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Active Tokens</span>
            </div>
            <p className="text-3xl font-black tracking-wide mb-1">{userTokens.length}</p>
            <p className="text-sm text-muted-foreground">
              {userTokens.filter((t) => t.graduated).length} graduated
            </p>
          </Card>

          <Card className="p-6 pixel-corners border-2 border-primary/40">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">24h Volume</span>
            </div>
            <p className="text-3xl font-black tracking-wide mb-1">{formatCurrency(totalVolume24h)}</p>
            <p className="text-sm text-muted-foreground">
              Across all tokens
            </p>
          </Card>

          <Card className="p-6 pixel-corners border-2 border-primary/40">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/20 rounded-full">
                {averagePriceChange >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <span className="text-sm text-muted-foreground">Avg. Change</span>
            </div>
            <p className={`text-3xl font-black tracking-wide mb-1 ${averagePriceChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {averagePriceChange >= 0 ? "+" : ""}{averagePriceChange.toFixed(2)}%
            </p>
            <p className="text-sm text-muted-foreground">
              24h average
            </p>
          </Card>
        </div>

        {/* My Tokens Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">My Tokens</h2>
            <Link href="/create">
              <Button className="controller-btn">
                <Coins className="w-5 h-5 mr-2" />
                Create Token
              </Button>
            </Link>
          </div>

          {userTokens.map((token) => (
            <Card key={token.id} className="p-6 pixel-corners border-2 border-primary/30 hover:border-primary/60 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <Image
                    src={token.image}
                    alt={token.name}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-primary/40"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-black tracking-wide">{token.symbol}</h3>
                      <Badge variant={token.graduated ? "default" : "outline"} className="font-bold">
                        {token.graduated ? "Graduated" : "Active"}
                      </Badge>
                      <Badge variant="secondary" className="font-bold">
                        {token.launchType === "project-raise" ? "Project Raise" : "Instant Launch"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{token.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{token.contractAddress}</p>
                  </div>
                </div>

                <Link href={`/token/${token.id}`}>
                  <Button variant="outline" className="controller-btn-outline">View Details</Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="p-4 bg-card/50 pixel-corners border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">Your Holdings</p>
                  <p className="text-lg font-black tracking-wide">50,000 {token.symbol}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(token.currentPrice * 50000)}
                  </p>
                </div>
                <div className="p-4 bg-card/50 pixel-corners border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">Current Price</p>
                  <p className="text-lg font-black tracking-wide">{formatCurrency(token.currentPrice)}</p>
                  <p className={`text-xs mt-1 font-bold ${token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {token.priceChange24h >= 0 ? "+" : ""}{token.priceChange24h.toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 bg-card/50 pixel-corners border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">Market Cap</p>
                  <p className="text-lg font-black tracking-wide">{formatCurrency(token.marketCap)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {token.holders} holders
                  </p>
                </div>
                <div className="p-4 bg-card/50 pixel-corners border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">24h Volume</p>
                  <p className="text-lg font-black tracking-wide">{formatCurrency(token.volume24h)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {token.transactions} txns
                  </p>
                </div>
                <div className="p-4 bg-card/50 pixel-corners border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">P&L</p>
                  <p className="text-lg font-black tracking-wide text-green-500">+$234.50</p>
                  <p className="text-xs text-green-500 mt-1 font-bold">+18.2%</p>
                </div>
              </div>
            </Card>
          ))}

          {userTokens.length === 0 && (
            <Card className="p-12 text-center pixel-corners border-2 border-primary/40">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Coins className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">No tokens yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Start trading or create your own token to build your portfolio
                </p>
                <Link href="/create">
                  <Button className="controller-btn">
                    <Coins className="w-5 h-5 mr-2" />
                    Create Token
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}