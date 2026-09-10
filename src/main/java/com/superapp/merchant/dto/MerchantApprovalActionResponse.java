package com.superapp.merchant.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MerchantApprovalActionResponse(
        String merchantId,
        String approvalStatus,
        String status,
        String reason
) {
    public static MerchantApprovalActionResponse approved(String merchantId) {
        return new MerchantApprovalActionResponse(merchantId, "APPROVED", null, null);
    }

    public static MerchantApprovalActionResponse rejected(String merchantId, String reason) {
        return new MerchantApprovalActionResponse(merchantId, "REJECTED", null, reason);
    }

    public static MerchantApprovalActionResponse suspended(String merchantId) {
        return new MerchantApprovalActionResponse(merchantId, null, "SUSPENDED", null);
    }

    public static MerchantApprovalActionResponse suspended(String merchantId, String reason) {
        return new MerchantApprovalActionResponse(merchantId, null, "SUSPENDED", reason);
    }
}
