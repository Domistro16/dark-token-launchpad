"use client";

import { useState, useEffect } from "react";
import { Token } from "@/types/token";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownUp, TrendingUp, TrendingDown, Loader2, Settings, ChevronDown, Lock } from "lucide-react";
import { formatCurrency, formatPrice } from "@/lib/utils/format";
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { ethers } from "ethers";
import { toast } from "sonner";
import { useBalance, useAccount } from 'wagmi'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TradingInterfaceProps {
  token: Token;
}

const abi = [
   {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
]

export function TradingInterface({ token }: TradingInterfaceProps) {
  const { sdk } = useSafuPadSDK();
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [bnbAmount, setBnbAmount] = useState("");
  const [isTrading, setIsTrading] = useState(false);
  const [bnbBalance, setBnbBalance] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [slippage, setSlippage] = useState("0.5");
  const {address} = useAccount()
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [graduatedToPancakeSwap, setGraduatedToPancakeSwap] = useState(token.graduatedToPancakeSwap || false);

  // Fetch latest graduation status
  useEffect(() => {
    const fetchGraduationStatus = async () => {
      if (!sdk || !token.graduated) {
        return;
      }
      
      try {
        const launchInfo = await sdk.launchpad.getLaunchInfo(token.id);
        setGraduatedToPancakeSwap(Boolean(launchInfo.graduatedToPancakeSwap));
      } catch (error) {
        console.error("Error fetching graduation status:", error);
      }
    };

    void fetchGraduationStatus();
    
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchGraduationStatus, 10000);
    return () => clearInterval(interval);
  }, [sdk, token.id, token.graduated]);

  // Trading logic:
  // - Buys disabled when pool has graduated
  // - Sells only disabled when graduated but NOT yet migrated to PancakeSwap
  const isBuyDisabled = token.graduated;
  const isSellDisabled = token.graduated && !graduatedToPancakeSwap;

  const provider = new ethers.JsonRpcProvider("https://bnb-testnet.g.alchemy.com/v2/tTuJSEMHVlxyDXueE8Hjv");
  const tokenCon = new ethers.Contract(token.contractAddress, abi, provider);
  // Fetch balances
  useEffect(() => {
    let cancelled = false;

    const fetchBalances = async () => {
      if (!sdk) {
        setLoadingBalances(true);
        return;
      }

      try {
        setLoadingBalances(true);

        // Get connected wallet address
    
        // Fetch BNB balance
        const bnbBal = await provider.getBalance(address);
        if (!cancelled) {
          setBnbBalance(ethers.formatEther(bnbBal));
        }

        // Fetch token balance
        const tokenBal = await tokenCon.balanceOf(address);
        if (!cancelled) {
          setTokenBalance(ethers.formatEther(tokenBal));
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
        if (!cancelled) {
          setBnbBalance("0");
          setTokenBalance("0");
        }
      } finally {
        if (!cancelled) {
          setLoadingBalances(false);
        }
      }
    };

    fetchBalances();

    // Refresh balances every 10 seconds
    const interval = setInterval(fetchBalances, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sdk, token.contractAddress, address]);

  const handleTrade = async () => {
    // Check if trade is allowed
    if (tradeType === "buy" && isBuyDisabled) {
      toast.error("Buying is disabled. This token has graduated to PancakeSwap.");
      return;
    }

    if (tradeType === "sell" && isSellDisabled) {
      if (!token.graduated) {
        toast.error("Token must graduate before selling is enabled.");
      } else {
        toast.error("Selling will be enabled after migration to PancakeSwap completes.");
      }
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!sdk) {
      toast.error("SDK not initialized");
      return;
    }

    setIsTrading(true);

    try {
      if (tradeType === "buy") {
        // Buy tokens with BNB
        const tx = await sdk.bondingDex.buyTokens(token.contractAddress, bnbAmount);
        
        toast.success(`Successfully bought ${amount} ${token.symbol}!`);
        console.log("Buy transaction:", tx);
      } else {
        // Sell tokens for BNB
        const tx = await sdk.bondingDex.sellTokens(token.contractAddress, amount);
        
        toast.success(`Successfully sold ${amount} ${token.symbol}!`);
        console.log("Sell transaction:", tx);
      }

      // Reset form
      setAmount("");
      setBnbAmount("");
      
      // Refresh balances after trade
      const address = await sdk.getAddress();
      const bnbBal = await sdk.getBNBBalance(address);
      setBnbBalance(ethers.formatEther(bnbBal));
      const tokenBal = await sdk.tokenFactory.getBalance(token.contractAddress, address);
      setTokenBalance(ethers.formatEther(tokenBal));
      
    } catch (error: any) {
      console.error("Trade error:", error);
      toast.error(error?.message || "Transaction failed");
    } finally {
      setIsTrading(false);
    }
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

  const formatBalance = (balance: string | null, loading: boolean) => {
    if (loading) return "Loading...";
    if (balance === null) return "0.00";
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  return (
    <Card className="p-6 sticky top-24">
      {/* Trading Status Alert */}
      {isBuyDisabled && (
        <Alert className="mb-4 bg-primary/10 border-primary/30">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Buying Disabled</strong> — This token has graduated. 
            {!isSellDisabled 
              ? " Only selling is available while migration completes." 
              : " Trading will resume on PancakeSwap after migration."}
          </AlertDescription>
        </Alert>
      )}

      {/* Compact Slippage Settings */}
      <div className="mb-4">
        <button
          onClick={() => setShowSlippageSettings(!showSlippageSettings)}
          className="w-full flex items-center justify-between p-3 bg-card/50 hover:bg-card/70 border-2 border-primary/20 hover:border-primary/40 rounded-lg transition-all group"
          disabled={isBuyDisabled && isSellDisabled}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground/90">SLIPPAGE</span>
            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded font-mono font-bold">
              {slippage}%
            </span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-muted-foreground transition-transform ${showSlippageSettings ? 'rotate-180' : ''}`}
          />
        </button>

        {showSlippageSettings && (
          <div className="mt-2 p-4 bg-gradient-to-br from-card/80 to-card/60 border-2 border-primary/30 rounded-lg space-y-3 glow-effect">
            <div className="grid grid-cols-4 gap-2">
              {["0.1", "0.5", "1.0", "2.0"].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  disabled={isBuyDisabled && isSellDisabled}
                  className={`
                    px-3 py-2 text-xs font-black rounded border-2 transition-all
                    ${slippage === val 
                      ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(255,176,0,0.5)]' 
                      : 'bg-card/30 text-foreground/70 border-primary/20 hover:border-primary/40 hover:bg-card/50'
                    }
                    ${(isBuyDisabled && isSellDisabled) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {val}%
                </button>
              ))}
            </div>
            
            <div className="relative">
              <Input
                id="slippage"
                type="number"
                placeholder="Custom %"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                step="0.1"
                min="0.1"
                max="50"
                disabled={isBuyDisabled && isSellDisabled}
                className="pr-10 text-center font-mono font-bold bg-background/50 border-primary/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">%</span>
            </div>
            
            <p className="text-[10px] text-muted-foreground leading-tight">
              ⚠️ Transaction reverts if price moves unfavorably beyond this threshold
            </p>
          </div>
        )}
      </div>

      <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as "buy" | "sell")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="buy" className="data-[state=active]:bg-green-500/20" disabled={isBuyDisabled}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20" disabled={isSellDisabled}>
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
              disabled={isTrading || isBuyDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Balance: {formatBalance(bnbBalance, loadingBalances)} BNB
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
              disabled={isTrading || isBuyDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Balance: {formatBalance(tokenBalance, loadingBalances)} {token.symbol}
            </p>
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">{formatPrice(token.currentPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trading Fee ({token.launchType === "project-raise" ? "1%" : "2%"})</span>
              <span className="font-medium">
                {bnbAmount ? (parseFloat(bnbAmount) * (token.launchType === "project-raise" ? 0.01 : 0.02)).toFixed(4) : "0.0000"} BNB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span className="font-medium">{slippage}%</span>
            </div>
          </div>

          <Button 
            onClick={handleTrade} 
            className="w-full controller-btn" 
            size="lg"
            disabled={isTrading || !bnbAmount || parseFloat(bnbAmount) <= 0 || isBuyDisabled}
          >
            {isBuyDisabled ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Buying Disabled
              </>
            ) : isTrading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buying...
              </>
            ) : (
              `Buy ${token.symbol}`
            )}
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
              disabled={isTrading || isSellDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Balance: {formatBalance(tokenBalance, loadingBalances)} {token.symbol}
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
              disabled={isTrading || isSellDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Balance: {formatBalance(bnbBalance, loadingBalances)} BNB
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
              <span className="font-medium">{slippage}%</span>
            </div>
          </div>

          <Button 
            onClick={handleTrade} 
            className="w-full controller-btn" 
            size="lg" 
            variant="destructive"
            disabled={isTrading || !amount || parseFloat(amount) <= 0 || isSellDisabled}
          >
            {isSellDisabled ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Selling Disabled
              </>
            ) : isTrading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Selling...
              </>
            ) : (
              `Sell ${token.symbol}`
            )}
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
              disabled={isTrading || isBuyDisabled}
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