package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record OfferApprovalResponse(
        String offerId,
        String approvalStatus,
        String status,
        String reason
) implements Serializable {
    public static OfferApprovalResponse approved(String offerId) {
        return new OfferApprovalResponse(offerId, "APPROVED", "ACTIVE", null);
    }

    public static OfferApprovalResponse rejected(String offerId, String reason) {
        return new OfferApprovalResponse(offerId, "REJECTED", null, reason);
    }

    public static OfferApprovalResponse submitted(String offerId) {
        return new OfferApprovalResponse(offerId, "PENDING_APPROVAL", null, null);
    }
}
