import apiClient from "./client";
import { ApiResponse, PaginatedResponse, PaginationParams } from "../types/api/common";

export interface BackendTransactionItem {
  id: string;
  transactionReference: string;
  merchantId: string;
  merchantName?: string;
  storeId?: string;
  storeName?: string;
  offerId?: string;
  grossAmount: number;
  discountAmount: number;
  payableAmount: number;
  status: "INITIATED" | "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentMethod?: string;
  createdAt: string;
}

export interface InitiatePaymentPayload {
  storeId: string;
  offerId?: string;
  grossAmount: number;
  paymentMethod: "UPI" | "CARD" | "NET_BANKING" | "WALLET";
  referenceType?: "DIRECT" | "QR_CODE" | "OFFER_LINK";
}

export interface PaymentInitiateResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  gatewayOrderId?: string;
  upiIntentUrl?: string;
  status: string;
}

export const transactionApi = {
  // Admin: list all transactions with multi-tenant filtering
  getAdminTransactions: async (params?: PaginationParams & { status?: string; merchantId?: string; storeId?: string; search?: string }): Promise<BackendTransactionItem[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/admin/transactions", { params });
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (data && "content" in data && Array.isArray(data.content)) return data.content;
      return [];
    } catch (err) {
      console.warn("[Transaction API] Admin transactions fetch:", err);
      return [];
    }
  },

  // Merchant: list transactions for merchant stores
  getMerchantTransactions: async (params?: PaginationParams & { storeId?: string; status?: string }): Promise<BackendTransactionItem[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any>>("/merchant/transactions", { params });
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (data && "content" in data && Array.isArray(data.content)) return data.content;
      return [];
    } catch (err) {
      console.warn("[Transaction API] Merchant transactions fetch:", err);
      return [];
    }
  },

  // Initiate a live payment with idempotency key
  initiatePayment: async (payload: InitiatePaymentPayload): Promise<PaymentInitiateResponse> => {
    const idempotencyKey = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const res = await apiClient.post<ApiResponse<PaymentInitiateResponse>>("/payments", payload, {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });
    return res.data?.data;
  },

  // Get payment status by ID
  getPaymentById: async (paymentId: string): Promise<PaymentInitiateResponse> => {
    const res = await apiClient.get<ApiResponse<PaymentInitiateResponse>>(`/payments/${paymentId}`);
    return res.data?.data;
  },
};
