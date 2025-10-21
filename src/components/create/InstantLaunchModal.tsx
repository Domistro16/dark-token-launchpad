"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Upload, Zap } from "lucide-react";
import { useSafuPadSDK } from "@/lib/safupad-sdk";

interface InstantLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstantLaunchModal({ isOpen, onClose }: InstantLaunchModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    totalSupply: "1000000000",
    initialBuy: "0",
    twitter: "",
    telegram: "",
    image: null as File | null,
    infofiWallet: "",
  });

  const { sdk, isInitializing, error: sdkError, connect } = useSafuPadSDK();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    setTxHash(null);

    // Basic validation
    if (!formData.name.trim() || !formData.symbol.trim() || !formData.description.trim()) {
      setSubmitError("Please fill in name, symbol, and description.");
      return;
    }
    if (!formData.totalSupply || Number(formData.totalSupply) <= 0) {
      setSubmitError("Total supply must be greater than 0.");
      return;
    }
    if (formData.initialBuy === "" || Number(formData.initialBuy) < 0) {
      setSubmitError("Initial buy cannot be negative.");
      return;
    }

    if (!sdk) {
      setSubmitError("SDK not ready. Please ensure your wallet is available.");
      return;
    }

    try {
      setSubmitting(true);
      // Ensure wallet is connected to provide signer
      const address = await connect();
      if (!address) {
        throw new Error("Wallet not connected.");
      }

      // Prepare params per SDK types
      const params = {
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        totalSupply: Number(formData.totalSupply),
        metadata: {
          logoURI: "", // Optional: wire image upload later
          description: formData.description.trim(),
          website: "",
          twitter: formData.twitter.trim(),
          telegram: formData.telegram.trim(),
          discord: "",
          // capture InfoFi wallet (optional, not enforced by SDK)
          infofiWallet: formData.infofiWallet.trim(),
        },
        initialBuyBNB: formData.initialBuy,
        burnLP: false,
      } as const;

      const tx = await sdk.launchpad.createInstantLaunch(params);
      setTxHash(tx.hash);
      // Wait for confirmation
      await tx.wait();
      onClose();
    } catch (e: any) {
      setSubmitError(e?.message || "Instant launch failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col justify-center">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Instant Launch
          </DialogTitle>
          <DialogDescription>
            Your token will be live immediately after creation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No approval needed! Your token goes live instantly. 2% trading fee: 1% to you, 0.9% to InfoFi platform, 0.1% platform fee.
            </AlertDescription>
          </Alert>

          {sdkError && (
            <Alert>
              <AlertDescription>
                SDK error: {String((sdkError as any)?.message || sdkError)}
              </AlertDescription>
            </Alert>
          )}

          {submitError && (
            <Alert>
              <AlertDescription>
                {submitError}
              </AlertDescription>
            </Alert>
          )}

          {txHash && (
            <Alert>
              <AlertDescription>
                Transaction submitted: {txHash}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Token Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Moon Rocket"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Token Symbol *</Label>
            <Input
              id="symbol"
              placeholder="e.g., MOON"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              maxLength={10}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Tell the community about your token..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalSupply">Total Supply *</Label>
            <Input
              id="totalSupply"
              type="number"
              placeholder="1000000000"
              value={formData.totalSupply}
              onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialBuy">Initial Buy (BNB) *</Label>
            <Input
              id="initialBuy"
              type="number"
              step="0.001"
              min="0"
              placeholder="0"
              value={formData.initialBuy}
              onChange={(e) => setFormData({ ...formData, initialBuy: e.target.value })}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              You may buy 0 BNB to start; higher buys can improve initial liquidity.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Token Image</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 2MB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter (optional)</Label>
              <Input
                id="twitter"
                placeholder="https://twitter.com/..."
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram (optional)</Label>
              <Input
                id="telegram"
                placeholder="https://t.me/..."
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="infofiWallet">InfoFi Wallet (optional)</Label>
            <Input
              id="infofiWallet"
              placeholder="0x..."
              value={formData.infofiWallet}
              onChange={(e) => setFormData({ ...formData, infofiWallet: e.target.value })}
              disabled={submitting}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-3">Fee Structure (2% total)</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform:</span>
              <span className="font-medium">0.1%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Creator (You):</span>
              <span className="font-medium">1.0%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">InfoFi (Platform):</span>
              <span className="font-medium">0.9%</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-3">Graduation Criteria</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Graduation Market Cap:</span>
              <span className="font-medium">$90,000</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">After Graduation:</span>
              <span className="font-medium">Listed on PancakeSwap + Dedicated InfoFi dashboard</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-3">Creator Benefits</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trading Fee Share:</span>
              <span className="font-medium">1% per trade</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Claim Cooldown:</span>
              <span className="font-medium">24 hours</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Claim Requirement:</span>
              <span className="font-medium">Maintain graduation market cap</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dashboard Access:</span>
              <span className="font-medium">Dedicated InfoFi dashboard</span>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Instant Launch Summary</h4>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Token:</strong> {formData.name || "---"} ({formData.symbol || "---"})</p>
              <p><strong>Supply:</strong> {formData.totalSupply ? parseInt(formData.totalSupply).toLocaleString() : "---"}</p>
              <p><strong>Initial Buy:</strong> {formData.initialBuy} BNB</p>
              {formData.infofiWallet && (
                <p><strong>InfoFi Wallet:</strong> {formData.infofiWallet}</p>
              )}
              <p><strong>Status:</strong> <span className="text-primary">Goes live immediately</span></p>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full controller-btn" size="lg" disabled={submitting || isInitializing}>
            <Zap className="w-4 h-4 mr-2" />
            {submitting ? "Creating..." : "Create & Launch Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}