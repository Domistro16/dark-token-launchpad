"use client";

import { TrendingUp, Coins, Users, Rocket } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { PlatformMetrics as PlatformMetricsType } from "@/types/token";

interface PlatformMetricsProps {
  metrics: PlatformMetricsType;
}

export function PlatformMetrics({ metrics }: PlatformMetricsProps) {
  const stats = [
    {
      label: "Total Value Locked",
      value: formatCurrency(metrics.totalValueLocked),
      icon: TrendingUp,
      change: "+12.5%",
    },
    {
      label: "24h Volume",
      value: formatCurrency(metrics.totalVolume24h),
      icon: Coins,
      change: "+8.3%",
    },
    {
      label: "Tokens Launched",
      value: formatNumber(metrics.totalTokensLaunched),
      icon: Rocket,
      change: `${metrics.activeProjects} active`,
    },
    {
      label: "Total Users",
      value: formatNumber(metrics.totalUsers),
      icon: Users,
      change: `${metrics.graduatedTokens} graduated`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <stat.icon className="w-8 h-8 text-primary" />
            <span className="text-sm text-muted-foreground">{stat.change}</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}