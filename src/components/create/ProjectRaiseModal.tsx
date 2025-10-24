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
import { Info, CheckCircle2, XCircle, Loader2 } from "lucide-react";

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
    targetAmount: "0.3",
    twitter: "",
    telegram: "",
    website: "",
    imageUrl: "",
    burnLP: false,
    vestingDuration: 3, // months, minimum 3
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Image validation state
  const [imageValidating, setImageValidating] = useState(false);
  const [imageValid, setImageValid] = useState<boolean | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // lazy import to avoid tree-shake issues
  const { useSafuPadSDK } = require("@/lib/safupad-sdk");
  const { sdk, isInitializing } = useSafuPadSDK();

  const TOTAL_SUPPLY = 1000000000; // 1 billion constant

  // Validate image URL
  const validateImage = (url: string) => {
    if (!url.trim()) {
      setImageValid(null);
      setImageError(null);
      return;
    }

    // Check if URL is valid format
    try {
      new URL(url);
    } catch {
      setImageValid(false);
      setImageError("Invalid URL format");
      return;
    }

    // Check if URL starts with http/https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setImageValid(false);
      setImageError("URL must start with http:// or https://");
      return;
    }

    setImageValidating(true);
    setImageError(null);
    setImageValid(null);

    // Create an image element to test if the URL is a valid image
    const img = new Image();
    
    img.onload = () => {
      setImageValidating(false);
      setImageValid(true);
      setImageError(null);
    };
    
    img.onerror = () => {
      setImageValidating(false);
      setImageValid(false);
      setImageError("Unable to load image. Please check the URL.");
    };
    
    // Add timeout for slow loading images
    const timeout = setTimeout(() => {
      if (imageValidating) {
        setImageValidating(false);
        setImageValid(false);
        setImageError("Image loading timeout. Please check the URL.");
      }
    }, 10000); // 10 second timeout
    
    img.src = url;
    
    // Cleanup
    return () => clearTimeout(timeout);
  };

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
    validateImage(url);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);
    setTxHash(null);

    // Basic validation
    if (!formData.name || !formData.symbol || !formData.targetAmount) {
      setError("Please fill in all required fields (name, symbol, target amount).");
      return;
    }
    
    // Image validation
    if (formData.imageUrl && imageValid === false) {
      setError("Please provide a valid image URL or leave it empty.");
      return;
    }
    
    if (formData.imageUrl && imageValidating) {
      setError("Please wait for image validation to complete.");
      return;
    }
    
    const targetBNB = Number(formData.targetAmount);
    if (!Number.isFinite(targetBNB) || targetBNB < 0.1 || targetBNB > 0.5) {
      setError("Target amount must be between 0.1 BNB and 0.5 BNB.");
      return;
    }
    if (formData.vestingDuration < 3 || formData.vestingDuration > 6) {
      setError("Vesting duration must be between 3 and 6 months.");
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
        logoURI: formData.imageUrl || "",
        description: formData.description || `${formData.name} (${formData.symbol}) project raise`,
        website: formData.website || "",
        twitter: formData.twitter || "",
        telegram: formData.telegram || "",
        discord: "",
      };

      // ✅ UPDATED for SDK v2.0.0: Use raiseTargetBNB and raiseMaxBNB instead of USD
      const params = {
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        totalSupply: TOTAL_SUPPLY,
        raiseTargetBNB: String(targetBNB), // ✅ Changed from raiseTargetUSD
        raiseMaxBNB: '0.5',    // ✅ Changed from raiseMaxUSD
        vestingDuration: formData.vestingDuration * 30,
        metadata,
        burnLP: formData.burnLP,
      };

      const tx = await sdk.launchpad.createLaunch(params);
      setTxHash(tx.hash);
      await tx.wait();
      setSuccess(true);
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
                Raise window is 24 hours. Target between 0.1-0.5 BNB.
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
              <Label>Total Supply</Label>
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-lg font-semibold">{TOTAL_SUPPLY.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fixed supply of 1 billion tokens
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Token Image URL</Label>
              <div className="relative">
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/token-image.png"
                  value={formData.imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  disabled={submitting || isInitializing}
                  className={
                    formData.imageUrl && imageValid === false
                      ? "border-destructive"
                      : formData.imageUrl && imageValid === true
                      ? "border-green-500"
                      : ""
                  }
                />
                {imageValidating && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {!imageValidating && imageValid === true && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
                {!imageValidating && imageValid === false && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                )}
              </div>
              {imageError && (
                <p className="text-xs text-destructive">{imageError}</p>
              )}
              {!imageError && (
                <p className="text-xs text-muted-foreground">
                  Direct link to your token's image (PNG, JPG, GIF)
                </p>
              )}
              {imageValid === true && formData.imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={formData.imageUrl}
                    alt="Token preview"
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                  />
                  <span className="text-xs text-green-500">Image verified ✓</span>
                </div>
              )}
            </div>

            <Button onClick={() => setStep(2)} className="w-full controller-btn" disabled={submitting || isInitializing || imageValidating}>
              Continue to Raise Settings
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Set your fundraising target between 0.1 BNB and 0.5 BNB
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount (BNB) *</Label>
              <Input
                id="targetAmount"
                type="number"
                min="0.1"
                max="0.5"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                disabled={submitting || isInitializing}
              />
              <Slider
                value={[parseFloat(formData.targetAmount)]}
                onValueChange={(value) => setFormData({ ...formData, targetAmount: value[0].toFixed(2) })}
                min={0.1}
                max={0.5}
                step={0.05}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                {parseFloat(formData.targetAmount).toFixed(2)} BNB
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vestingDuration">
                Vesting Duration (Project Go-Live Date) *
              </Label>
              <Input
                id="vestingDuration"
                type="number"
                min="3"
                max="6"
                value={formData.vestingDuration}
                onChange={(e) => setFormData({ ...formData, vestingDuration: Number(e.target.value) })}
                disabled={submitting || isInitializing}
              />
              <Slider
                value={[formData.vestingDuration]}
                onValueChange={(value) => setFormData({ ...formData, vestingDuration: value[0] })}
                min={3}
                max={6}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                {formData.vestingDuration} month{formData.vestingDuration !== 1 ? 's' : ''} - Your project will go live at the end of the vesting period
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="burnLP"
                  checked={formData.burnLP}
                  onChange={(e) => setFormData({ ...formData, burnLP: e.target.checked })}
                  disabled={submitting || isInitializing}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="burnLP" className="cursor-pointer">
                  Burn LP tokens after launch
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Burning LP tokens permanently locks liquidity, preventing removal and building trust with investors
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm mb-3">Token Distribution</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Owner Allocation:</span>
                <span className="font-medium">20% (10% immediate, 10% vested)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Liquidity Pool:</span>
                <span className="font-medium">10% (capped at 100 BNB)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Public Sale:</span>
                <span className="font-medium">70%</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm mb-3">Fee Structure (1.9% total)</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Creator (You):</span>
                <span className="font-medium">1.0%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">InfoFi (Project):</span>
                <span className="font-medium">0.6%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Liquidity:</span>
                <span className="font-medium">0.3%</span>
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
                <p><strong>Supply:</strong> {TOTAL_SUPPLY.toLocaleString()}</p>
                <p><strong>Target:</strong> {parseFloat(formData.targetAmount).toFixed(2)} BNB</p>
                <p><strong>Vesting Duration:</strong> {formData.vestingDuration} month{formData.vestingDuration !== 1 ? 's' : ''}</p>
                <p><strong>Burn LP:</strong> {formData.burnLP ? 'Yes' : 'No'}</p>
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
              <Button onClick={handleSubmit} className="w-full controller-btn" disabled={submitting || isInitializing || (formData.imageUrl && imageValid !== true)}>
                {submitting ? "Launching..." : "Launch Project Raise"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}