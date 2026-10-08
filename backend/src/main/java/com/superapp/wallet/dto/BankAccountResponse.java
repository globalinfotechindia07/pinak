package com.superapp.wallet.dto;

import com.superapp.wallet.enums.BankAccountVerificationStatus;

import java.time.Instant;
import java.util.UUID;

public record BankAccountResponse(
        UUID id,
        UUID merchantId,
        String accountHolderName,
        String bankName,
        String accountNumberLast4,
        String ifscCode,
        String upiVpa,
        Boolean isPrimary,
        BankAccountVerificationStatus verificationStatus,
        String pennyDropReference,
        Instant createdAt
) {}
