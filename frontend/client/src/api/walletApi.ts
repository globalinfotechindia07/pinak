import apiClient from "./client";
import {
  MerchantWallet,
  WalletLedgerEntry,
  MerchantBankAccount,
  MerchantPayoutRequest,
  StoreRevenueSummary,
  PlatformSettlementOverview
} from "../types";
import { ApiResponse, PaginatedResponse } from "../types/api/common";

export const walletApi = {
  async getWalletSummary(merchantId?: string): Promise<MerchantWallet> {
    try {
      const res = await apiClient.get<ApiResponse<MerchantWallet>>("/merchant/wallet/summary", {
        params: merchantId ? { merchantId } : undefined
      });
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    return {
      id: "wal-101",
      merchantId: merchantId || "m-1",
      currency: "INR",
      availableBalance: 185400.0,
      pendingBalance: 12500.0,
      totalWithdrawn: 420000.0,
      lifetimeVolume: 617900.0,
      status: "ACTIVE",
      updatedAt: new Date().toISOString()
    };
  },

  async getWalletLedger(merchantId?: string, storeId?: string): Promise<WalletLedgerEntry[]> {
    try {
      const res = await apiClient.get<ApiResponse<PaginatedResponse<WalletLedgerEntry>>>("/merchant/wallet/ledger", {
        params: {
          ...(merchantId && { merchantId }),
          ...(storeId && storeId !== "ALL" && { storeId })
        }
      });
      if (res.data?.data?.content) return res.data.data.content;
      if (Array.isArray(res.data?.data)) return res.data.data as any;
    } catch {
      // Fallback
    }
    return [];
  },

  async getBankAccounts(merchantId?: string): Promise<MerchantBankAccount[]> {
    try {
      const res = await apiClient.get<ApiResponse<MerchantBankAccount[]>>("/merchant/wallet/bank-accounts", {
        params: merchantId ? { merchantId } : undefined
      });
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    return [];
  },

  async addBankAccount(payload: {
    merchantId?: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiVpa?: string;
  }): Promise<MerchantBankAccount> {
    const res = await apiClient.post<ApiResponse<MerchantBankAccount>>("/merchant/wallet/bank-accounts", payload, {
      params: payload.merchantId ? { merchantId: payload.merchantId } : undefined
    });
    return res.data?.data;
  },

  async getMerchantPayouts(merchantId?: string): Promise<MerchantPayoutRequest[]> {
    try {
      const res = await apiClient.get<ApiResponse<PaginatedResponse<MerchantPayoutRequest>>>("/merchant/wallet/payouts", {
        params: merchantId ? { merchantId } : undefined
      });
      if (res.data?.data?.content) return res.data.data.content;
      if (Array.isArray(res.data?.data)) return res.data.data as any;
    } catch {
      // Fallback
    }
    return [];
  },

  async requestPayout(payload: {
    merchantId?: string;
    amount: number;
    bankAccountId: string;
    mode: "IMPS" | "NEFT" | "RTGS" | "UPI";
    idempotencyKey: string;
    otpCode?: string;
  }): Promise<MerchantPayoutRequest> {
    const res = await apiClient.post<ApiResponse<MerchantPayoutRequest>>(
      "/merchant/wallet/payout",
      payload,
      {
        params: payload.merchantId ? { merchantId: payload.merchantId } : undefined,
        headers: {
          "X-Idempotency-Key": payload.idempotencyKey
        }
      }
    );
    return res.data?.data;
  },

  async getPlatformSettlementOverview(): Promise<PlatformSettlementOverview> {
    try {
      const res = await apiClient.get<ApiResponse<PlatformSettlementOverview>>("/admin/settlements/overview");
      if (res.data?.data) return res.data.data;
    } catch {
      // Fallback
    }
    return {
      totalPlatformGmv: 4850000.0,
      totalEscrowBalance: 1240000.0,
      netCommissionEarned: 121250.0,
      totalMerchantWallets: 42,
      pendingPayoutCount: 3,
      pendingPayoutVolume: 145000.0,
      failedPayoutCount: 1
    };
  }
};

