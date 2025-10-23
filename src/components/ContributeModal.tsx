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
import { getProgressPercentage } from "@/lib/utils/format";
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
  const [bnbRaised, setBnbRaised] = useState<number>(0);
  const [bnbTarget, setBnbTarget] = useState<number>(0);
  
  // Early return if no token
  if (!token) return null;
  
  const isProjectRaise = token.launchType === "project-raise";
  
  // Convert USD values to BNB for display
  const loadBnbValues = async () => {
    if (!sdk || !token.projectRaise) return;
    
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
  
  // Load BNB values when modal opens
  if (isOpen && sdk && bnbTarget === 0) {
    void loadBnbValues();
  }
  
  // Calculate raise progress percentage
  const raiseProgress = isProjectRaise && token.projectRaise 
    ? getProgressPercentage(token.projectRaise.raisedAmount, token.projectRaise.targetAmount)
    : 0;
async function simulateContribution(tokenAddress: string, bnbAmount: string, sdk: any) {
  try {
    const signer = await sdk.provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    // Encode the function call
   const iface = new ethers.Interface([
      'function contribute(address token) payable'
    ]);
    const data = iface.encodeFunctionData('contribute', [token.id]);
    
    // Simulate with eth_call
    console.log('🔍 Simulating transaction...');
    const result = await sdk.provider.call({
      from: signerAddress,
      to: sdk.launchpad.address,
      data: data,
      value: ethers.parseEther(bnbAmount)
    });
    
    console.log('✅ Simulation successful!', result);
    return true;
    
  } catch (error: any) {
    console.log('❌ Simulation failed!');
    console.log('Error:', error);
    
    // Try to decode the error
    if (error.data) {
      console.log('Error data:', error.data);
      
      // Try to decode as a string
      try {
        const reason = ethers.toUtf8String('0x' + error.data.slice(138));
        console.log('Decoded reason:', reason);
      } catch {}
    }
    
    return false;
  }
}


  const handleContribute = async () => {
    setSubmitError(null);
    setTxHash(null);

    const amountBNB = Number(contribution);
    if (!amountBNB || amountBNB <= 0) {
      setSubmitError("Please enter a valid amount greater than 0.");
      return;
    }

    // Usage


    if (!sdk) {
      setSubmitError("SDK not ready. Please ensure your wallet is connected.");
      return;
    }
    
    try {
      setIsContributing(true);
      
      // Contribute directly with BNB amount
      await simulateContribution(token.id, amountBNB.toString(), sdk);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner()
      const iface = new ethers.Interface([
      'function contribute(address token) payable'
    ]);
      const launchpad = new ethers.Contract(sdk.launchpad.address, [{
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "contribute",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },], signer)
      const tx = await launchpad.contribute(token.id, {value: ethers.parseEther(amountBNB.toString())});
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
            <Label htmlFor="contribution">Contribution Amount (BNB)</Label>
            <Input
              id="contribution"
              type="number"
              inputMode="decimal"
              placeholder="Enter BNB amount"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              className="bg-card/60 border-primary/30"
              disabled={isContributing}
              step="0.01"
              min="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Minimum contribution: 0.01 BNB
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
                    {bnbRaised.toFixed(4)} BNB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium">
                    {bnbTarget.toFixed(4)} BNB
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
              <p><strong>Amount:</strong> {contribution || "0"} BNB</p>
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