"use client";

import { VestingSchedule } from "@/types/token";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Clock, Lock, Loader2, TrendingUp, Wallet, Coins } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils/format";
import { format } from "date-fns";
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";

interface VestingTimelineProps {
  vestingSchedule: VestingSchedule;
  tokenAddress: string;
  vestingData?: {
    startMarketCap: number;
    vestingDuration: number;
    vestingStartTime: Date | null;
    founderTokens: number;
    founderTokensClaimed: number;
  };
}

export function VestingTimeline({ vestingSchedule, tokenAddress, vestingData }: VestingTimelineProps) {
  const { sdk } = useSafuPadSDK();
  const [timeBasedProgress, setTimeBasedProgress] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [claimableTokens, setClaimableTokens] = useState<number>(0);
  const [claimableFunds, setClaimableFunds] = useState<number>(0);
  const [claimingTokens, setClaimingTokens] = useState(false);
  const [claimingFunds, setClaimingFunds] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchVestingData = async () => {
      if (!sdk || !tokenAddress) {
        setLoading(true);
        return;
      }

      setLoading(true);

      try {
        // 1. Get time-based vesting progress (percentage based on time elapsed)
        const timeProgress = await sdk.launchpad.getTimeBasedVestingProgress(tokenAddress);
        
        // 2. Get remaining vesting time in seconds
        const remainingSeconds = await sdk.launchpad.getRemainingVestingTime(tokenAddress);

        // 3. Get claimable amounts
        const claimableAmounts = await sdk.launchpad.getClaimableAmounts(tokenAddress);
        console.log(claimableAmounts.claimableFunds)
        if (!cancelled) {
          // Convert BigNumber/string to number if needed
          setTimeBasedProgress(Number(timeProgress));
          setRemainingTime(Number(remainingSeconds));
          setClaimableTokens(Number(ethers.formatEther(claimableAmounts.claimableTokens || 0)));
          setClaimableFunds(Number(ethers.formatEther(claimableAmounts.claimableFunds || 0)));
        }
      } catch (error) {
        console.error('Error fetching vesting data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchVestingData();

    // Refresh vesting data every minute
    const interval = setInterval(fetchVestingData, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sdk, tokenAddress]);

  const handleClaimTokens = async () => {
    if (!sdk || claimingTokens) return;
    
    setClaimingTokens(true);
    try {
      console.log('Claiming founder tokens...');
      await sdk.launchpad.claimFounderToken(tokenAddress);
      toast.success('Founder tokens claimed successfully!');
      
      // Refresh claimable amounts after claiming
      const claimableAmounts = await sdk.launchpad.getClaimableAmounts(tokenAddress);
      setClaimableTokens(Number(ethers.formatEther(claimableAmounts.claimableTokens || 0)));
      setClaimableFunds(Number(ethers.formatEther(claimableAmounts.claimableFunds || 0)));
    } catch (error: any) {
      console.error('Error claiming founder tokens:', error);
      toast.error(error?.message || 'Failed to claim founder tokens');
    } finally {
      setClaimingTokens(false);
    }
  };

  const handleClaimFunds = async () => {
    if (!sdk || claimingFunds) return;
    
    setClaimingFunds(true);
    try {
      console.log('Claiming raised funds...');
      await sdk.launchpad.claimRaisedFunds(tokenAddress);
      toast.success('Raised funds claimed successfully!');
      
      // Refresh claimable amounts after claiming
      const claimableAmounts = await sdk.launchpad.getClaimableAmounts(tokenAddress);
      setClaimableTokens(Number(ethers.formatEther(claimableAmounts.claimableTokens || 0)));
      setClaimableFunds(Number(ethers.formatEther(claimableAmounts.claimableFunds || 0)));
    } catch (error: any) {
      console.error('Error claiming raised funds:', error);
      toast.error(error?.message || 'Failed to claim raised funds');
    } finally {
      setClaimingFunds(false);
    }
  };

  // Calculate display values
  const percentageReleased = vestingData 
    ? (vestingData.founderTokensClaimed / vestingData.founderTokens) * 100
    : (vestingSchedule.releasedAmount / vestingSchedule.totalAmount) * 100;
  
  // Format remaining time
  const formatRemainingTime = (seconds: number): string => {
    if (seconds <= 0) return "Vesting Complete";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  // Format vesting duration (in seconds to human-readable)
  const formatVestingDuration = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const months = Math.floor(days / 30);
    if (months > 0) return `${months} Month${months > 1 ? 's' : ''}`;
    return `${days} Day${days > 1 ? 's' : ''}`;
  };

  return (
    <Card className="p-4 sm:p-6 min-w-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold mb-1 break-words">Vesting Schedule</h3>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            {vestingData 
              ? `${formatNumber(vestingData.founderTokensClaimed)} / ${formatNumber(vestingData.founderTokens)} tokens released (${percentageReleased.toFixed(1)}%)`
              : `${formatNumber(vestingSchedule.releasedAmount)} / ${formatNumber(vestingSchedule.totalAmount)} tokens released (${percentageReleased.toFixed(1)}%)`
            }
          </p>
        </div>
        {vestingData && (
          <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0">
            <Lock className="w-3 h-3" />
            {formatVestingDuration(vestingData.vestingDuration)}
          </Badge>
        )}
      </div>

      {/* SDK Vesting Data Display */}
      {vestingData && (
        <div className="mb-6 space-y-3">
          {/* Starting Market Cap */}
          <div className="p-3 sm:p-4 bg-accent/5 border border-accent/20 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 flex-shrink-0">
                <TrendingUp className="w-3 h-3" />
                Starting Market Cap
              </span>
              <span className="text-base sm:text-lg font-black text-accent break-words">
                {formatCurrency(vestingData.startMarketCap)}
              </span>
            </div>
          </div>

          {/* Vesting Start Time */}
          {vestingData.vestingStartTime && (
            <div className="p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  Vesting Start Time
                </span>
                <span className="text-base sm:text-lg font-black text-primary break-words">
                  {format(vestingData.vestingStartTime, "MMM dd, yyyy HH:mm")}
                </span>
              </div>
            </div>
          )}

          {/* Founder Tokens */}
          <div className="p-3 sm:p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Total Founder Tokens</span>
              <span className="text-base sm:text-lg font-black text-secondary break-all">
                {formatNumber(vestingData.founderTokens)}
              </span>
            </div>
          </div>

          {/* Founder Tokens Claimed */}
          <div className="p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Founder Tokens Claimed</span>
              <span className="text-base sm:text-lg font-black text-primary break-all">
                {formatNumber(vestingData.founderTokensClaimed)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentageReleased, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SDK Vesting Progress Data */}
      {loading ? (
        <div className="mb-6 p-4 bg-muted/30 rounded-lg flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading vesting progress...</span>
        </div>
      ) : (
        <div className="mb-6 space-y-3">
          {/* Time-Based Progress */}
          <div className="p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Time-Based Progress</span>
              <span className="text-base sm:text-lg font-black text-primary">{timeBasedProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(timeBasedProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Remaining Time */}
          <div className="p-3 sm:p-4 bg-accent/5 border border-accent/20 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3" />
                Remaining Time
              </span>
              <span className="text-base sm:text-lg font-black text-accent break-words">{formatRemainingTime(remainingTime)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Founder Claimable Amounts Box */}
      {!loading && (claimableFunds > 0 || claimableTokens > 0) && (
        <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-2 border-primary/30 rounded-lg pixel-corners">
          <h4 className="text-sm sm:text-base font-bold mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Founder Claimable Amounts
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Claimable Funds */}
            {claimableFunds > 0 && (
              <div className="p-3 bg-background/60 rounded-lg border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">Claimable Funds (BNB)</div>
                <div className="text-lg sm:text-xl font-black text-primary mb-3">{formatCurrency(claimableFunds)}</div>
                <Button 
                  className="controller-btn w-full text-xs sm:text-sm" 
                  onClick={handleClaimFunds}
                  disabled={claimingFunds}
                  size="sm"
                >
                  {claimingFunds ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-3 h-3 mr-2" />
                      Claim Funds
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* Claimable Tokens */}
            {claimableTokens > 0 && (
              <div className="p-3 bg-background/60 rounded-lg border border-accent/20">
                <div className="text-xs text-muted-foreground mb-1">Claimable Tokens</div>
                <div className="text-lg sm:text-xl font-black text-accent mb-3">{formatNumber(claimableTokens)}</div>
                <Button 
                  className="controller-btn w-full text-xs sm:text-sm" 
                  onClick={handleClaimTokens}
                  disabled={claimingTokens}
                  size="sm"
                >
                  {claimingTokens ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Coins className="w-3 h-3 mr-2" />
                      Claim Tokens
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {vestingSchedule.schedule.map((milestone, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border min-w-0 ${
              milestone.released
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/30 border-border"
            }`}
          >
            <div className="mt-1 flex-shrink-0">
              {milestone.released ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              ) : (
                <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm sm:text-base break-words">
                  {index === 0 ? "Initial Release" : `Month ${index}`}
                </h4>
                <Badge variant={milestone.released ? "default" : "secondary"} className="text-xs flex-shrink-0">
                  {milestone.released ? "Released" : "Pending"}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="break-words">{format(milestone.date, "MMM dd, yyyy")}</span>
                </div>
                <div className="font-medium break-all">
                  {formatNumber(milestone.amount)} tokens
                </div>
              </div>
            </div>

            {milestone.released && (
              <Button variant="outline" size="sm" disabled className="controller-btn-outline flex-shrink-0 text-xs sm:text-sm">
                Claimed
              </Button>
            )}
            
            {!milestone.released && new Date() >= milestone.date && (
              <Button variant="default" size="sm" className="controller-btn flex-shrink-0 text-xs sm:text-sm">
                Claim
              </Button>
            )}
          </div>
        ))}
      </div>

      {vestingSchedule.schedule.some(m => !m.released) && (
        <div className="mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg text-xs sm:text-sm text-muted-foreground break-words">
          💡 Tokens will be released monthly. You can claim them once they become available.
        </div>
      )}
    </Card>
  );
}