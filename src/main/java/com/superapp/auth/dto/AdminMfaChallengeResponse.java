package com.superapp.auth.dto;

public record AdminMfaChallengeResponse(
        boolean mfaRequired,
        String challengeId
) {}
