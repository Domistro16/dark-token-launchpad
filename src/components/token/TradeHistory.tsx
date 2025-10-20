"use client";

import { Trade } from "@/types/token";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAddress, formatCurrency } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (trades.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Recent Trades</h3>
        <div className="text-center py-8 text-muted-foreground">
          No trades yet. Be the first to trade!
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">Recent Trades</h3>
      
      <div className="space-y-3">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                trade.type === "buy" ? "bg-green-500/10" : "bg-red-500/10"
              }`}>
                {trade.type === "buy" ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={trade.type === "buy" ? "default" : "secondary"}>
                    {trade.type.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-mono text-muted-foreground">
                    {formatAddress(trade.userAddress)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{trade.amount.toLocaleString()}</span>
                  <span className="text-muted-foreground"> tokens for </span>
                  <span className="font-medium">{formatCurrency(trade.total)}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium mb-1">
                {formatCurrency(trade.price)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(trade.timestamp, { addSuffix: true })}
                </span>
                <a
                  href={`https://bscscan.com/tx/${trade.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}