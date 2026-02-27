"use client";

import useSWR from "swr";
import { useAuth } from "@/contexts/auth-context";

export interface DashboardStats {
  // Core metrics
  totalUsers: number;
  newUsersWeek: number;
  userGrowthPercent: number;
  activeListings: number;
  newListingsWeek: number;
  listingGrowthPercent: number;
  completedTrades: number;
  tradesThisWeek: number;
  tradeGrowthPercent: number;
  totalVolume: number;
  volumeThisWeek: number;
  volumeGrowthPercent: number;
  
  // Real-time indicators
  onlineUsers: number;
  activeTraders: number;
  pendingOffers: number;
  
  // User-specific stats
  userListings: number;
  userActiveListings: number;
  userPendingOffers: number;
  userUnreadMessages: number;
  userSavedListings: number;
  userProfileViews: number;
  userTradeSuccessRate: number;
  userWalletBalance: number;
  
  // Activity trends
  activityTrend: Array<{
    day: string;
    listings: number;
    trades: number;
    users: number;
  }>;
  
  // Top categories
  topCategories: Array<{
    name: string;
    count: number;
    growth: number;
  }>;
  
  // Regional stats
  regionalStats: Array<{
    region: string;
    listings: number;
    users: number;
  }>;
  
  // Platform health
  platformHealth: {
    uptime: number;
    avgResponseTime: number;
    activeConnections: number;
    queuedJobs: number;
  };
  
  source: "database" | "demo";
  timestamp: string;
}

const fetcher = async (url: string): Promise<DashboardStats> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
};

export function useDashboardStats() {
  const { user } = useAuth();
  
  const url = user?.id 
    ? `/api/dashboard/stats?userId=${user.id}` 
    : "/api/dashboard/stats";
  
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    url,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds for real-time feel
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
    isLive: data?.source === "database",
  };
}

// Hook for real-time activity indicators
export function useRealtimeIndicators() {
  const { data, error, isLoading } = useSWR<{
    onlineUsers: number;
    activeTraders: number;
    recentTrades: number;
  }>(
    "/api/dashboard/stats",
    fetcher,
    {
      refreshInterval: 10000, // More frequent updates for real-time indicators
      revalidateOnFocus: true,
    }
  );

  return {
    onlineUsers: data?.onlineUsers ?? 0,
    activeTraders: data?.activeTraders ?? 0,
    isLoading,
    isError: !!error,
  };
}

// Format large numbers with K, M suffixes
export function formatStatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NA", {
    style: "currency",
    currency: "NAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calculate percentage change display
export function formatGrowth(percent: number): {
  text: string;
  isPositive: boolean;
} {
  const isPositive = percent >= 0;
  return {
    text: `${isPositive ? "+" : ""}${percent.toFixed(1)}%`,
    isPositive,
  };
}
