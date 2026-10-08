import {
  MerchantWallet,
  WalletLedgerEntry,
  MerchantBankAccount,
  MerchantPayoutRequest,
  StoreRevenueSummary,
  PlatformSettlementOverview
} from "../types";

export const walletApi = {
  async getWalletSummary(merchantId?: string): Promise<MerchantWallet> {
    try {
      const query = merchantId ? `?merchantId=${merchantId}` : "";
      const res = await fetch(`/api/v1/merchant/wallet/summary${query}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {
      // Fallback local mock state
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
      const params = new URLSearchParams();
      if (merchantId) params.append("merchantId", merchantId);
      if (storeId) params.append("storeId", storeId);
      const res = await fetch(`/api/v1/merchant/wallet/ledger?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.content) return json.data.content;
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async getBankAccounts(merchantId?: string): Promise<MerchantBankAccount[]> {
    try {
      const query = merchantId ? `?merchantId=${merchantId}` : "";
      const res = await fetch(`/api/v1/merchant/wallet/bank-accounts${query}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
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
  }): Promise<MerchantPayoutRequest> {
    const res = await fetch(`/api/v1/merchant/wallet/payout${payload.merchantId ? `?merchantId=${payload.merchantId}` : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Payout request failed");
    }
    const json = await res.json();
    return json.data;
  },

  async getPlatformSettlementOverview(): Promise<PlatformSettlementOverview> {
    try {
      const res = await fetch("/api/v1/admin/settlements/overview");
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
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
