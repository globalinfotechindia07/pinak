package com.superapp.auth.dto;

public record OtpRequestResponse(
        String otpRequestId,
        long expiresIn
) {}
