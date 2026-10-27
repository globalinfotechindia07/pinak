package com.superapp.offer.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum OfferType {
    PERCENTAGE_DISCOUNT,
    FIXED_DISCOUNT,
    CASHBACK,
    BOGO;

    @JsonCreator
    public static OfferType fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        return switch (normalized) {
            case "PERCENTAGE_DISCOUNT", "PERCENTAGE", "FLAT_PCT", "PERCENT", "PCT" -> PERCENTAGE_DISCOUNT;
            case "FIXED_DISCOUNT", "FLAT", "FLAT_AMT", "FIXED", "AMOUNT", "AMT" -> FIXED_DISCOUNT;
            case "CASHBACK" -> CASHBACK;
            case "BOGO", "BUY_ONE_GET_ONE", "1+1", "BUY_X_GET_Y", "BUY_X_GET_X" -> BOGO;
            default -> FIXED_DISCOUNT;
        };
    }
}
