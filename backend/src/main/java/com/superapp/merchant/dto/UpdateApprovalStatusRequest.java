package com.superapp.merchant.dto;

import com.superapp.merchant.entity.ApprovalStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateApprovalStatusRequest(
        @NotNull(message = "Approval status must not be null")
        ApprovalStatus status,

        String notes
) {
}
