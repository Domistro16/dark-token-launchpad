"use client";

import { VestingSchedule } from "@/types/token";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Clock, Lock } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { format } from "date-fns";

interface VestingTimelineProps {
  vestingSchedule: VestingSchedule;
}

export function VestingTimeline({ vestingSchedule }: VestingTimelineProps) {
  const percentageReleased = (vestingSchedule.releasedAmount / vestingSchedule.totalAmount) * 100;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold mb-1">Vesting Schedule</h3>
          <p className="text-sm text-muted-foreground">
            {formatNumber(vestingSchedule.releasedAmount)} / {formatNumber(vestingSchedule.totalAmount)} tokens released ({percentageReleased.toFixed(1)}%)
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          6 Months
        </Badge>
      </div>

      <div className="space-y-4">
        {vestingSchedule.schedule.map((milestone, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 p-4 rounded-lg border ${
              milestone.released
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/30 border-border"
            }`}
          >
            <div className="mt-1">
              {milestone.released ? (
                <CheckCircle className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">
                  {index === 0 ? "Initial Release" : `Month ${index}`}
                </h4>
                <Badge variant={milestone.released ? "default" : "secondary"} className="text-xs">
                  {milestone.released ? "Released" : "Pending"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{format(milestone.date, "MMM dd, yyyy")}</span>
                </div>
                <div className="font-medium">
                  {formatNumber(milestone.amount)} tokens
                </div>
              </div>
            </div>

            {milestone.released && (
              <Button variant="outline" size="sm" disabled className="controller-btn-outline">
                Claimed
              </Button>
            )}
            
            {!milestone.released && new Date() >= milestone.date && (
              <Button variant="default" size="sm" className="controller-btn">
                Claim
              </Button>
            )}
          </div>
        ))}
      </div>

      {vestingSchedule.schedule.some(m => !m.released) && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          💡 Tokens will be released monthly. You can claim them once they become available.
        </div>
      )}
    </Card>
  );
}