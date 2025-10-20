"use client";

import { useState } from "react";
import { Token } from "@/types/token";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownUp, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface TradingInterfaceProps {
  token: Token;
}

export function TradingInterface({ token }: TradingInterfaceProps) {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [bnbAmount, setBnbAmount] = useState("");

  const handleTrade = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    const action = tradeType === "buy" ? "Buying" : "Selling";
    alert(`${action} ${amount} ${token.symbol}!`);
    setAmount("");
    setBnbAmount("");
  };

  const calculateBnb = (tokenAmount: string) => {
    if (!tokenAmount) return "";
    const bnb = parseFloat(tokenAmount) * token.currentPrice;
    return bnb.toFixed(4);
  };

  const calculateTokens = (bnb: string) => {
    if (!bnb) return "";
    const tokens = parseFloat(bnb) / token.currentPrice;
    return tokens.toFixed(2);
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setBnbAmount(calculateBnb(value));
  };

  const handleBnbChange = (value: string) => {
    setBnbAmount(value);
    setAmount(calculateTokens(value));
  };

  return (
    <Card className="p-6 sticky top-24">
      <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as "buy" | "sell")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="buy" className="data-[state=active]:bg-green-500/20">
            <TrendingUp className="w-4 h-4 mr-2" />
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20">
            <TrendingDown className="w-4 h-4 mr-2" />
            Sell
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bnb-buy">You Pay (BNB)</Label>
            <Input
              id="bnb-buy"
              type="number"
              placeholder="0.0"
              value={bnbAmount}
              onChange={(e) => handleBnbChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Balance: 1.5 BNB
            </p>
          </div>

          <div className="flex justify-center">
            <div className="p-2 bg-muted rounded-full">
              <ArrowDownUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-buy">You Receive ({token.symbol})</Label>
            <Input
              id="token-buy"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Balance: 0 {token.symbol}
            </p>
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">{formatCurrency(token.currentPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trading Fee ({token.launchType === "project-raise" ? "1%" : "2%"})</span>
              <span className="font-medium">
                {bnbAmount ? (parseFloat(bnbAmount) * (token.launchType === "project-raise" ? 0.01 : 0.02)).toFixed(4) : "0.0000"} BNB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span className="font-medium">0.5%</span>
            </div>
          </div>

          <Button onClick={handleTrade} className="w-full controller-btn" size="lg">
            Buy {token.symbol}
          </Button>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token-sell">You Sell ({token.symbol})</Label>
            <Input
              id="token-sell"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Balance: 0 {token.symbol}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="p-2 bg-muted rounded-full">
              <ArrowDownUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bnb-sell">You Receive (BNB)</Label>
            <Input
              id="bnb-sell"
              type="number"
              placeholder="0.0"
              value={bnbAmount}
              onChange={(e) => handleBnbChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Balance: 1.5 BNB
            </p>
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">{formatCurrency(token.currentPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trading Fee ({token.launchType === "project-raise" ? "1%" : "2%"})</span>
              <span className="font-medium">
                {bnbAmount ? (parseFloat(bnbAmount) * (token.launchType === "project-raise" ? 0.01 : 0.02)).toFixed(4) : "0.0000"} BNB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span className="font-medium">0.5%</span>
            </div>
          </div>

          <Button onClick={handleTrade} className="w-full controller-btn" size="lg" variant="destructive">
            Sell {token.symbol}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Quick Buy Buttons */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground mb-3">Quick Buy</p>
        <div className="grid grid-cols-4 gap-2">
          {(["0.1", "0.5", "1", "5"]) .map((val) => (
            <Button
              key={val}
              variant="outline"
              size="sm"
              className="controller-btn-outline"
              onClick={() => {
                setBnbAmount(val);
                setAmount(calculateTokens(val));
              }}
            >
              {val} BNB
            </Button>
          ))}
        </div>
      </div>

      {/* InfoFi Dashboard Link */}
      {token.infofiDashboard && (
        <div className="mt-6 pt-6 border-t border-border">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">InfoFi Dashboard</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee Pool</span>
                <span className="font-medium">{formatCurrency(token.infofiDashboard.feePool)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Fees</span>
                <span className="font-medium">{formatCurrency(token.infofiDashboard.totalFees)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}