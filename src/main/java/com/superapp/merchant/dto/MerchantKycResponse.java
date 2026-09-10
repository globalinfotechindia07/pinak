package com.superapp.merchant.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MerchantKycResponse(
        UUID id,
        UUID merchantId,
        String documentType,
        String status,
        Instant submittedAt
) {
}
