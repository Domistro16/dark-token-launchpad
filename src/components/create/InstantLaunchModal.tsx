"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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
    initialBuy: "0",
    twitter: "",
    telegram: "",
    imageUrl: ""
  });

  const TOTAL_SUPPLY = 1000000000; // 1 billion constant

  const { sdk, isInitializing, error: sdkError, connect } = useSafuPadSDK();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Image validation state
  const [imageValidating, setImageValidating] = useState(false);
  const [imageValid, setImageValid] = useState<boolean | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

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
    setSubmitError(null);
    setTxHash(null);

    // Basic validation
    if (!formData.name.trim() || !formData.symbol.trim() || !formData.description.trim()) {
      setSubmitError("Please fill in name, symbol, and description.");
      return;
    }
    if (formData.initialBuy === "" || Number(formData.initialBuy) < 0) {
      setSubmitError("Initial buy cannot be negative.");
      return;
    }
    
    // Image validation
    if (formData.imageUrl && imageValid === false) {
      setSubmitError("Please provide a valid image URL or leave it empty.");
      return;
    }
    
    if (formData.imageUrl && imageValidating) {
      setSubmitError("Please wait for image validation to complete.");
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
        totalSupply: TOTAL_SUPPLY,
        metadata: {
          logoURI: formData.imageUrl.trim(),
          description: formData.description.trim(),
          website: "",
          twitter: formData.twitter.trim(),
          telegram: formData.telegram.trim(),
          discord: ""
        },
        initialBuyBNB: formData.initialBuy,
        burnLP: false
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <AlertDescription className="!whitespace-pre-line !whitespace-pre-line">No approval needed! Your token goes live instantly. 2.0% trading fee: 1% to you, 0.9% to InfoFi platform, 0.1% platform fee.

            </AlertDescription>
          </Alert>

          {sdkError &&
          <Alert>
              <AlertDescription>
                SDK error: {String((sdkError as any)?.message || sdkError)}
              </AlertDescription>
            </Alert>
          }

          {submitError &&
          <Alert>
              <AlertDescription>
                {submitError}
              </AlertDescription>
            </Alert>
          }

          {txHash &&
          <Alert>
              <AlertDescription>
                Transaction submitted: {txHash}
              </AlertDescription>
            </Alert>
          }

          <div className="space-y-2">
            <Label htmlFor="name">Token Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Moon Rocket"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={submitting} />

          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Token Symbol *</Label>
            <Input
              id="symbol"
              placeholder="e.g., MOON"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              maxLength={10}
              disabled={submitting} />

          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Tell the community about your token..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={submitting} />

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
            <Label htmlFor="initialBuy">Initial Buy (BNB) *</Label>
            <Input
              id="initialBuy"
              type="number"
              step="0.001"
              min="0"
              placeholder="0"
              value={formData.initialBuy}
              onChange={(e) => setFormData({ ...formData, initialBuy: e.target.value })}
              disabled={submitting} />

            <p className="text-xs text-muted-foreground">
              You may buy 0 BNB to start; higher buys can improve initial liquidity.
            </p>
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
                disabled={submitting}
                className={
                  formData.imageUrl && imageValid === false
                    ? "border-destructive"
                    : formData.imageUrl && imageValid === true
                    ? "border-green-500"
                    : ""
                } />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter (optional)</Label>
              <Input
                id="twitter"
                placeholder="https://twitter.com/..."
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                disabled={submitting} />

            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram (optional)</Label>
              <Input
                id="telegram"
                placeholder="https://t.me/..."
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                disabled={submitting} />

            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-3">Fee Structure (2.1% total)</h4>
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
              <span className="font-medium">1.0%</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-3">Graduation Criteria</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground !whitespace-pre-line !w-0 !h-0">Graduation T:</span>
              <span className="font-medium !whitespace-pre-line">15 BNB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">After Graduation:</span>
              <span className="font-medium !whitespace-pre-line">Listed on PancakeSwap</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-3">Creator Benefits</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trading Fee Share:</span>
              <span className="font-medium !whitespace-pre-line">2% per trade</span>
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
              <p><strong>Supply:</strong> {TOTAL_SUPPLY.toLocaleString()}</p>
              <p><strong>Initial Buy:</strong> {formData.initialBuy} BNB</p>
              <p><strong>Status:</strong> <span className="text-primary">Goes live immediately</span></p>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full controller-btn" 
            size="lg" 
            disabled={submitting || isInitializing || imageValidating || (formData.imageUrl && imageValid !== true)}
          >
            <Zap className="w-4 h-4 mr-2" />
            {submitting ? "Creating..." : "Create & Launch Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>);

}