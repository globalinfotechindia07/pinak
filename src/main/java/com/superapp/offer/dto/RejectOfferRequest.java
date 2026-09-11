package com.superapp.offer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectOfferRequest(
        @NotBlank(message = "Rejection reason is mandatory")
        @Size(max = 1000, message = "Reason cannot exceed 1000 characters")
        String reason
) {}
