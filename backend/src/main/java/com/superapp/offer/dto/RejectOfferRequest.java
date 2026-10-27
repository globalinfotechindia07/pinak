package com.superapp.offer.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RejectOfferRequest(
        @NotBlank(message = "Rejection reason is mandatory")
        @Size(max = 1000, message = "Reason cannot exceed 1000 characters")
        @JsonAlias({"rejectionReason"})
        String reason
) {}
