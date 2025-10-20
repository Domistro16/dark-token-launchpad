"use client";

import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTokens, mockClaims } from "@/lib/mockData";
import { formatCurrency, formatAddress } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";
import { Coins, Clock, CheckCircle, TrendingUp, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function PortfolioPage() {
  // Mock data - in real app, filter by connected wallet
  const userTokens = mockTokens.filter((t) => t.launchType === "instant-launch" || t.projectRaise?.approved);
  const userClaims = mockClaims;

  const totalPortfolioValue = userTokens.reduce((sum, token) => {
    return sum + (token.marketCap * 0.02); // Mock 2% holdings
  }, 0);

  const claimableAmount = userTokens
    .filter((t) => t.instantLaunch?.claimableAmount)
    .reduce((sum, t) => sum + (t.instantLaunch?.claimableAmount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">
            Manage your tokens, track earnings, and claim rewards
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Value</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(totalPortfolioValue)}</p>
            <p className="text-sm text-green-500 mt-1">+15.3% (24h)</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Active Tokens</span>
            </div>
            <p className="text-3xl font-bold">{userTokens.length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {userTokens.filter((t) => t.graduated).length} graduated
            </p>
          </Card>

          <Card className="p-6 bg-primary/10 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Claimable Fees</span>
            </div>
            <p className="text-3xl font-bold text-primary">{formatCurrency(claimableAmount)}</p>
            <Button className="mt-3 w-full controller-btn" size="sm">
              Claim All
            </Button>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tokens" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tokens">My Tokens</TabsTrigger>
            <TabsTrigger value="claims">Claim History</TabsTrigger>
          </TabsList>

          <TabsContent value="tokens" className="space-y-4">
            {userTokens.map((token) => (
              <Card key={token.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <Image
                      src={token.image}
                      alt={token.name}
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{token.symbol}</h3>
                        <Badge variant={token.graduated ? "default" : "outline"}>
                          {token.graduated ? "Graduated" : "Active"}
                        </Badge>
                        <Badge variant="secondary">
                          {token.launchType === "project-raise" ? "Project Raise" : "Instant Launch"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{token.name}</p>
                    </div>
                  </div>

                  <Link href={`/token/${token.id}`}>
                    <Button variant="outline" className="controller-btn-outline">View Details</Button>
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your Holdings</p>
                    <p className="text-sm font-bold">50,000 {token.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(token.currentPrice * 50000)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                    <p className="text-sm font-bold">{formatCurrency(token.currentPrice)}</p>
                    <p className={`text-xs ${token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {token.priceChange24h >= 0 ? "+" : ""}{token.priceChange24h.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
                    <p className="text-sm font-bold">{formatCurrency(token.marketCap)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(token.volume24h)} Vol
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">P&L</p>
                    <p className="text-sm font-bold text-green-500">+$234.50</p>
                    <p className="text-xs text-green-500">+18.2%</p>
                  </div>
                </div>

                {/* Instant Launch Claim */}
                {token.instantLaunch && token.instantLaunch.claimableAmount > 0 && (
                  <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div>
                      <p className="font-semibold mb-1">Creator Fees Available</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(token.instantLaunch.claimableAmount)} ready to claim
                      </p>
                      {token.instantLaunch.lastClaimTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Last claimed {formatDistanceToNow(token.instantLaunch.lastClaimTime, { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <Button className="controller-btn">
                      Claim {formatCurrency(token.instantLaunch.claimableAmount)}
                    </Button>
                  </div>
                )}
              </Card>
            ))}

            {userTokens.length === 0 && (
              <Card className="p-12 text-center">
                <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No tokens yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start trading or create your own token
                </p>
                <Link href="/create">
                  <Button className="controller-btn">Create Token</Button>
                </Link>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            {userClaims.map((claim) => {
              const token = mockTokens.find((t) => t.id === claim.tokenId);
              return (
                <Card key={claim.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{token?.symbol}</h3>
                          <Badge variant="outline" className="text-xs">
                            {claim.type === "creator-fee" ? "Creator Fee" : "Vesting Release"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Claimed {formatDistanceToNow(claim.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        {claim.type === "creator-fee" 
                          ? formatCurrency(claim.amount)
                          : `${claim.amount.toLocaleString()} tokens`
                        }
                      </p>
                      <a
                        href={`https://bscscan.com/tx/${claim.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 justify-end mt-1"
                      >
                        View on BSCScan <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </Card>
              );
            })}

            {userClaims.length === 0 && (
              <Card className="p-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No claims yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your claim history will appear here
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}