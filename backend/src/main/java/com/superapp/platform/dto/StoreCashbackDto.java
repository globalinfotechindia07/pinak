package com.superapp.platform.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.superapp.store.entity.Store;

import java.math.BigDecimal;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StoreCashbackDto(
        UUID storeId,
        String storeName,
        String cityName,
        BigDecimal cashbackPercentage,
        BigDecimal maxCashbackAmount,
        BigDecimal minTransactionForCashback,
        Boolean isCashbackEnabled
) {
    public static StoreCashbackDto fromStore(Store store) {
        if (store == null) return null;
        return new StoreCashbackDto(
                store.getId(),
                store.getStoreName(),
                store.getCityId(),
                store.getCashbackPercentage(),
                store.getMaxCashbackAmount(),
                store.getMinTransactionForCashback(),
                store.getIsCashbackEnabled()
        );
    }
}
