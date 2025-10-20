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
import { Slider } from "@/components/ui/slider";
import { Info, Upload } from "lucide-react";

interface ProjectRaiseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectRaiseModal({ isOpen, onClose }: ProjectRaiseModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    totalSupply: "1000000000",
    targetAmount: "250000",
    twitter: "",
    telegram: "",
    website: "",
    image: null as File | null,
    infofiWallet: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // lazy import to avoid tree-shake issues
  const { useSafuPadSDK } = require("@/lib/safupad-sdk");
  const { sdk, isInitializing } = useSafuPadSDK();

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);
    setTxHash(null);

    // Basic validation
    if (!formData.name || !formData.symbol || !formData.totalSupply || !formData.targetAmount) {
      setError("Please fill in all required fields (name, symbol, total supply, target amount).");
      return;
    }
    const totalSupplyNum = Number(formData.totalSupply);
    if (!Number.isFinite(totalSupplyNum) || totalSupplyNum <= 0) {
      setError("Total supply must be a positive number.");
      return;
    }
    const targetUSD = Number(formData.targetAmount);
    if (!Number.isFinite(targetUSD) || targetUSD < 50000 || targetUSD > 500000) {
      setError("Target amount must be between $50,000 and $500,000.");
      return;
    }

    if (!sdk) {
      setError("SDK not ready. Please connect your wallet and try again.");
      return;
    }

    try {
      setSubmitting(true);
      // Ensure wallet is connected
      await sdk.connect();
      const founder = await sdk.getAddress();

      const metadata = {
        logoURI: "",
        description: formData.description || `${formData.name} (${formData.symbol}) project raise`,
        website: formData.website || "",
        twitter: formData.twitter || "",
        telegram: formData.telegram || "",
        discord: "",
      };

      const params = {
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        totalSupply: totalSupplyNum,
        raiseTargetUSD: String(targetUSD),
        raiseMaxUSD: String(targetUSD), // keep max equal to target for now
        vestingDuration: 180, // 6 months per product spec
        metadata,
        projectInfoFiWallet: formData.infofiWallet.trim() || founder, // prefer provided wallet, fallback to founder
        burnLP: true,
      };

      const tx = await sdk.launchpad.createLaunch(params);
      setTxHash(tx.hash);
      await tx.wait();
      setSuccess(true);
      // Optionally close after success
      // onClose();
    } catch (e: any) {
      const message = e?.message || "Failed to create project raise.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Project Raise</DialogTitle>
          <DialogDescription>
            Step {step} of 3: Fill in your token details
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>
              Project Raise submitted! Tx: {txHash ? (
                <a
                  className="underline"
                  href={sdk?.getExplorerUrl("tx", txHash) || "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  {txHash.slice(0, 10)}...
                </a>
              ) : (
                "Confirmed"
              )}
            </AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your project will require admin approval before going live. Raise window is 24 hours.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="name">Token Name *</Label>
              <Input
                id="name"
                placeholder="e.g., DeFi Warriors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Token Symbol *</Label>
              <Input
                id="symbol"
                placeholder="e.g., DWRR"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                maxLength={10}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your project..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                disabled={submitting || isInitializing}
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
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Token Image</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full controller-btn" disabled={submitting || isInitializing}>
              Continue to Raise Settings
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Set your fundraising target between $50,000 and $500,000
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount (USD) *</Label>
              <Input
                id="targetAmount"
                type="number"
                min="50000"
                max="500000"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                disabled={submitting || isInitializing}
              />
              <Slider
                value={[parseInt(formData.targetAmount)]}
                onValueChange={(value) => setFormData({ ...formData, targetAmount: value[0].toString() })}
                min={50000}
                max={500000}
                step={10000}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                ${parseInt(formData.targetAmount).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="infofiWallet">InfoFi Wallet (optional)</Label>
              <Input
                id="infofiWallet"
                placeholder="0x..."
                value={formData.infofiWallet}
                onChange={(e) => setFormData({ ...formData, infofiWallet: e.target.value })}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm mb-3">Token Distribution</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Owner Allocation:</span>
                <span className="font-medium">20% (10% immediate, 10% vested)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Liquidity Pool:</span>
                <span className="font-medium">10% (capped at $100k)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Public Sale:</span>
                <span className="font-medium">70%</span>
              </div>
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

            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="w-full controller-btn-outline" disabled={submitting || isInitializing}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="w-full controller-btn" disabled={submitting || isInitializing}>
                Continue to Social Links
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Social links help build trust with your community (optional but recommended)
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                placeholder="https://twitter.com/yourproject"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                placeholder="https://t.me/yourproject"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://yourproject.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Review Your Launch</h4>
              <div className="text-sm space-y-1">
                <p><strong>Token:</strong> {formData.name} ({formData.symbol})</p>
                <p><strong>Supply:</strong> {parseInt(formData.totalSupply).toLocaleString()}</p>
                <p><strong>Target:</strong> ${parseInt(formData.targetAmount).toLocaleString()}</p>
                {formData.infofiWallet && (
                  <p><strong>InfoFi Wallet:</strong> {formData.infofiWallet}</p>
                )}
                <p><strong>Status:</strong> {success ? "Submitted" : "Awaiting approval"}</p>
                {txHash && (
                  <p>
                    <strong>Transaction:</strong>{" "}
                    <a
                      className="underline"
                      href={sdk?.getExplorerUrl("tx", txHash) || "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {txHash}
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="w-full controller-btn-outline" disabled={submitting || isInitializing}>
                Back
              </Button>
              <Button onClick={handleSubmit} className="w-full controller-btn" disabled={submitting || isInitializing}>
                {submitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}