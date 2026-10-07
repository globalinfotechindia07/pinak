package com.superapp.store.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record StoreApprovalActionResponse(
        String storeId,
        String status,
        String approvalStatus,
        String reason
) {
    public static StoreApprovalActionResponse approved(String storeId) {
        return new StoreApprovalActionResponse(storeId, "ACTIVE", "APPROVED", null);
    }

    public static StoreApprovalActionResponse rejected(String storeId, String reason) {
        return new StoreApprovalActionResponse(storeId, null, "REJECTED", reason);
    }

    public static StoreApprovalActionResponse suspended(String storeId, String reason) {
        return new StoreApprovalActionResponse(storeId, "SUSPENDED", null, reason);
    }

    public static StoreApprovalActionResponse submitted(String storeId) {
        return new StoreApprovalActionResponse(storeId, null, "PENDING_APPROVAL", null);
    }
}
