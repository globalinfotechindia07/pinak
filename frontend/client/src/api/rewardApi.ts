import apiClient from "./client";
import { ApiResponse, PaginatedResponse } from "../types/api/common";

export interface RewardBalanceDTO {
  customerId: string;
  pointsBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: string;
}

export interface RewardLedgerItemDTO {
  id: string;
  transactionId?: string;
  customerId?: string;
  customerName?: string;
  points: number;
  type: "EARN" | "REDEEM" | "EXPIRE" | "ADJUSTMENT" | "REVERSAL";
  description: string;
  createdAt: string;
  status: string;
}

export interface AdminRewardAdjustmentRequest {
  customerId: string;
  pointsDelta: number;
  reason: string;
}

export const rewardApi = {
  // Get customer reward balance
  async getRewardBalance(): Promise<RewardBalanceDTO | null> {
    const res = await apiClient.get<ApiResponse<RewardBalanceDTO>>("/rewards");
    return res.data?.data || null;
  },

  // Get reward ledger transactions
  async getLedger(params?: {
    type?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<RewardLedgerItemDTO[]> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<RewardLedgerItemDTO> | RewardLedgerItemDTO[]>>("/rewards/ledger", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        ...(params?.type ? { type: params.type } : {}),
        ...(params?.status ? { status: params.status } : {}),
      },
    });
    if (Array.isArray(res.data?.data)) return res.data.data;
    return (res.data?.data as PaginatedResponse<RewardLedgerItemDTO>)?.content || [];
  },

  // Admin reward adjustment
  async adjustReward(data: AdminRewardAdjustmentRequest): Promise<any> {
    const idempotencyKey = `adj_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const res = await apiClient.post<ApiResponse<any>>("/admin/rewards/adjustments", data, {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });
    return res.data?.data;
  },

  // Admin get full reward ledger across all customers
  async getAdminLedger(params?: {
    customerId?: string;
    type?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<RewardLedgerItemDTO[]> {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/admin/rewards/ledger", {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 50,
          ...(params?.customerId ? { customerId: params.customerId } : {}),
          ...(params?.type ? { type: params.type } : {}),
          ...(params?.status ? { status: params.status } : {}),
        },
      });
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (data && "content" in data && Array.isArray(data.content)) return data.content;
      return [];
    } catch (err) {
      console.warn("[Reward API] Failed to fetch admin reward ledger:", err);
      return [];
    }
  },

  // Admin get customer reward account balance and tier
  async getCustomerRewardAccount(customerId: string): Promise<RewardBalanceDTO | null> {
    try {
      const res = await apiClient.get<ApiResponse<RewardBalanceDTO>>(`/admin/rewards/${customerId}`);
      return res.data?.data || null;
    } catch (err) {
      console.warn(`[Reward API] Failed to fetch reward account for ${customerId}:`, err);
      return null;
    }
  },

  // Admin reverse a reward ledger entry
  async reverseReward(ledgerEntryId: string, reason: string): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>("/admin/rewards/reversals", {
      ledgerEntryId,
      reason,
    });
    return res.data?.data;
  },
};
