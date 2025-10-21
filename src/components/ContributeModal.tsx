"use client";

import { useState } from "react";
import { Token } from "@/types/token";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, getProgressPercentage } from "@/lib/utils/format";
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { Zap, TrendingUp, Info } from "lucide-react";
import {ethers} from 'ethers'

interface ContributeModalProps {
  token: Token | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContributeModal({ token, isOpen, onClose }: ContributeModalProps) {
  const { sdk } = useSafuPadSDK();
  const [contribution, setContribution] = useState<string>("");
  const [isContributing, setIsContributing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Early return if no token
  if (!token) return null;
  
  const isProjectRaise = token.launchType === "project-raise";
  
  // Calculate raise progress percentage
  const raiseProgress = isProjectRaise && token.projectRaise 
    ? getProgressPercentage(token.projectRaise.raisedAmount, token.projectRaise.targetAmount)
    : 0;

  const handleContribute = async () => {
    setSubmitError(null);
    setTxHash(null);

    const amountUSD = Number(contribution);
    if (!amountUSD || amountUSD <= 0) {
      setSubmitError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!sdk) {
      setSubmitError("SDK not ready. Please ensure your wallet is connected.");
      return;
    }
    
    try {
      setIsContributing(true);
      
      // Convert USD to BNB using the SDK's price oracle
      const amountBNB = await sdk.priceOracle.usdToBNB(ethers.parseEther(amountUSD.toString()));
      
      // Pass the BNB amount to the contribute method
      const tx = await sdk.launchpad.contribute(token.id, ethers.formatUnits(amountBNB.toString(), 18));
      setTxHash(tx.hash);
      await tx.wait();
      onClose();
      setContribution("");
    } catch (err: any) {
      console.error("Contribution failed:", err);
      setSubmitError(err?.message || "Contribution failed. Please try again.");
    } finally {
      setIsContributing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Contribute to {token.symbol}
          </DialogTitle>
          <DialogDescription>
            Power up this raise. Join the mission and help reach the target.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Higher contributions boost progress faster. Be part of the launch!
            </AlertDescription>
          </Alert>

          {submitError && (
            <Alert>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {txHash && (
            <Alert>
              <AlertDescription>Transaction submitted: {txHash}</AlertDescription>
            </Alert>
          )}

          {/* Gamified energy bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Progress Power
              </span>
              <span className="font-medium text-primary">{raiseProgress.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full bg-input pixel-corners overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] energy-bar" 
                style={{ width: `${raiseProgress}%` }} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution">Contribution Amount (USD)</Label>
            <Input
              id="contribution"
              type="number"
              inputMode="decimal"
              placeholder="Enter amount"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              className="bg-card/60 border-primary/30"
              disabled={isContributing}
            />
            <p className="text-xs text-muted-foreground">
              Minimum contribution: $10 USD
            </p>
          </div>

          {/* Progress preview */}
          {isProjectRaise && token.projectRaise && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Raise Progress
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">
                    {formatCurrency(token.projectRaise.raisedAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium">
                    {formatCurrency(token.projectRaise.targetAmount)}
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage(
                    token.projectRaise.raisedAmount, 
                    token.projectRaise.targetAmount
                  )} 
                  className="h-2" 
                />
              </div>
            </div>
          )}

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Your Contribution</h4>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Token:</strong> {token.name} ({token.symbol})</p>
              <p><strong>Amount:</strong> {contribution || "0"} USD</p>
              <p><strong>Type:</strong> <span className="text-primary">Project Raise</span></p>
            </div>
          </div>

          <Button 
            onClick={handleContribute}
            className="w-full controller-btn" 
            size="lg"
            disabled={isContributing || !contribution || Number(contribution) <= 0}
          >
            <Zap className="w-4 h-4 mr-2" />
            {isContributing ? "Contributing..." : "Confirm Contribution"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}