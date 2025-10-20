"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mockTokens } from "@/lib/mockData";
import { formatCurrency, formatAddress } from "@/lib/utils/format";
import { Shield, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function AdminPage() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState("");

  const pendingTokens = mockTokens.filter(
    (t) => t.launchType === "project-raise" && t.projectRaise && !t.projectRaise.approved && t.status === "pending"
  );

  const handleApprove = (tokenId: string) => {
    alert(`Token ${tokenId} approved!`);
    setSelectedToken(null);
    setReviewReason("");
  };

  const handleReject = (tokenId: string) => {
    if (!reviewReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    alert(`Token ${tokenId} rejected. Reason: ${reviewReason}`);
    setSelectedToken(null);
    setReviewReason("");
  };

  const token = mockTokens.find((t) => t.id === selectedToken);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">
            Review and approve Project Raise submissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Pending Review</span>
            </div>
            <p className="text-2xl font-bold">{pendingTokens.length}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Approved</span>
            </div>
            <p className="text-2xl font-bold">
              {mockTokens.filter((t) => t.projectRaise?.approved).length}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Rejected</span>
            </div>
            <p className="text-2xl font-bold">0</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Reviewed</span>
            </div>
            <p className="text-2xl font-bold">
              {mockTokens.filter((t) => t.projectRaise).length}
            </p>
          </Card>
        </div>

        {/* Pending Tokens */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Pending Approvals</h2>

          {pendingTokens.map((token) => (
            <Card key={token.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <Image
                    src={token.image}
                    alt={token.name}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">{token.symbol}</h3>
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Review
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{token.name}</p>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      {token.description}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="controller-btn"
                    onClick={() => handleApprove(token.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="controller-btn-outline"
                    onClick={() => setSelectedToken(token.id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Creator</p>
                  <p className="text-sm font-mono">{formatAddress(token.creatorAddress)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Supply</p>
                  <p className="text-sm font-bold">{(token.totalSupply / 1000000).toFixed(0)}M</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target Raise</p>
                  <p className="text-sm font-bold">
                    {token.projectRaise ? formatCurrency(token.projectRaise.targetAmount) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contract</p>
                  <p className="text-sm font-mono">{formatAddress(token.contractAddress)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Social Links</p>
                  <div className="flex gap-2">
                    {token.twitter && <Badge variant="outline">Twitter</Badge>}
                    {token.telegram && <Badge variant="outline">Telegram</Badge>}
                    {token.website && <Badge variant="outline">Website</Badge>}
                  </div>
                </div>
              </div>

              {token.projectRaise && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3">Project Raise Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Owner Allocation:</span>
                      <span className="ml-2 font-medium">20%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Liquidity:</span>
                      <span className="ml-2 font-medium">10%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vesting:</span>
                      <span className="ml-2 font-medium">6 months</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Graduation:</span>
                      <span className="ml-2 font-medium">$500K cap</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}

          {pendingTokens.length === 0 && (
            <Card className="p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-sm text-muted-foreground">
                No pending Project Raise submissions to review
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      {token && (
        <Dialog open={!!selectedToken} onOpenChange={() => setSelectedToken(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Project Raise</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting {token.name} ({token.symbol})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this project is being rejected..."
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be sent to the project creator
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 controller-btn-outline"
                  onClick={() => setSelectedToken(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 controller-btn"
                  onClick={() => handleReject(token.id)}
                >
                  Reject Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}