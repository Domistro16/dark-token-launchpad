export type LaunchType = "project-raise" | "instant-launch";

export type TokenStatus = "pending" | "active" | "completed" | "graduated";

export interface ProjectRaiseConfig {
  type: "project-raise";
  targetAmount: number; // $50k - $500k
  raiseWindow: number; // 24 hours in milliseconds
  ownerAllocation: number; // 20% of total supply
  immediateUnlock: number; // 10% unlocked immediately
  vestingMonths: number; // 6 months
  liquidityAllocation: number; // 10% of total supply
  liquidityCap: number; // $100k max
  graduationThreshold: number; // $500k market cap
  tradingFee: {
    platform: number; // 0.1%
    academy: number; // 0.3%
    infofiPlatform: number; // 0.6% - goes to InfoFi platform wallet
  };
}

export interface InstantLaunchConfig {
  type: "instant-launch";
  tradingFee: {
    platform: number; // 0.1%
    creator: number; // 1.0%
    infofiPlatform: number; // 0.9% - goes to InfoFi platform wallet
  };
  graduationThreshold: number; // 15 BNB cumulative buys
  claimCooldown: number; // 24 hours
  marketCapRequirement: boolean; // Must be >= graduation market cap to claim
  accrualPeriod: number; // 1 week before distributing to InfoFi
}

export interface VestingSchedule {
  totalAmount: number;
  releasedAmount: number;
  schedule: {
    date: Date;
    amount: number;
    released: boolean;
  }[];
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  contractAddress: string;
  creatorAddress: string;
  launchType: LaunchType;
  status: TokenStatus;
  createdAt: Date;
  
  // Financial data
  totalSupply: number;
  currentPrice: number;
  marketCap: number;
  liquidityPool: number;
  volume24h: number;
  priceChange24h: number;
  
  // Project Raise specific
  projectRaise?: {
    config: ProjectRaiseConfig;
    raisedAmount: number;
    targetAmount: number;
    startTime: Date;
    endTime: Date;
    vestingSchedule: VestingSchedule;
    approved: boolean;
  };
  
  // Instant Launch specific
  instantLaunch?: {
    config: InstantLaunchConfig;
    cumulativeBuys: number;
    creatorFees: number;
    lastClaimTime: Date | null;
    claimableAmount: number;
  };
  
  // Graduation
  graduated: boolean;
  graduationDate?: Date;
  startingMarketCap: number;
  
  // Social
  twitter?: string;
  telegram?: string;
  website?: string;
  
  // Stats
  holders: number;
  transactions: number;
}

export interface PlatformMetrics {
  totalTokensLaunched: number;
  totalValueLocked: number;
  totalVolume24h: number;
  activeProjects: number;
  graduatedTokens: number;
  totalUsers: number;
  infofiPlatformFees: number; // Total fees accumulated by InfoFi platform
}

export interface Trade {
  id: string;
  tokenId: string;
  type: "buy" | "sell";
  amount: number;
  price: number;
  total: number;
  userAddress: string;
  timestamp: Date;
  txHash: string;
}

export interface Claim {
  id: string;
  tokenId: string;
  creatorAddress: string;
  amount: number;
  timestamp: Date;
  txHash: string;
  type: "creator-fee" | "vesting-release";
}

export interface AdminAction {
  id: string;
  tokenId: string;
  action: "approve" | "reject";
  reason?: string;
  adminAddress: string;
  timestamp: Date;
}