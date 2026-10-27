package com.superapp.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.platform.dto.CashbackSettingDto;
import com.superapp.platform.dto.StoreCashbackDto;
import com.superapp.platform.entity.PlatformSetting;
import com.superapp.platform.repository.PlatformSettingRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CashbackSettingsServiceImpl implements CashbackSettingsService {

    private static final Logger log = LoggerFactory.getLogger(CashbackSettingsServiceImpl.class);
    private static final String SETTING_KEY = "TRANSACTION_CASHBACK";

    private final PlatformSettingRepository platformSettingRepository;
    private final StoreRepository storeRepository;
    private final ObjectMapper objectMapper;

    public CashbackSettingsServiceImpl(
            PlatformSettingRepository platformSettingRepository,
            StoreRepository storeRepository,
            ObjectMapper objectMapper) {
        this.platformSettingRepository = platformSettingRepository;
        this.storeRepository = storeRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public CashbackSettingDto getGlobalCashbackSetting() {
        return platformSettingRepository.findBySettingKey(SETTING_KEY)
                .map(setting -> {
                    try {
                        return objectMapper.readValue(setting.getSettingValue(), CashbackSettingDto.class);
                    } catch (Exception e) {
                        log.warn("Failed to parse TRANSACTION_CASHBACK setting: {}", e.getMessage());
                        return CashbackSettingDto.defaults();
                    }
                })
                .orElse(CashbackSettingDto.defaults());
    }

    @Override
    @Transactional
    public CashbackSettingDto updateGlobalCashbackSetting(CashbackSettingDto request, String updatedBy) {
        try {
            String json = objectMapper.writeValueAsString(request);
            PlatformSetting setting = platformSettingRepository.findBySettingKey(SETTING_KEY)
                    .orElseGet(() -> new PlatformSetting(
                            SETTING_KEY, json,
                            "Global transaction cashback policy managed by Super Admin",
                            updatedBy
                    ));

            setting.setSettingValue(json);
            setting.setUpdatedBy(updatedBy);
            platformSettingRepository.save(setting);

            if (Boolean.TRUE.equals(request.applyToAllStores())) {
                List<Store> allStores = storeRepository.findAll();
                for (Store s : allStores) {
                    if (request.defaultPercentage() != null) {
                        s.setCashbackPercentage(request.defaultPercentage());
                    }
                    if (request.maxCashbackPerTransaction() != null) {
                        s.setMaxCashbackAmount(request.maxCashbackPerTransaction());
                    }
                    if (request.minTransactionAmount() != null) {
                        s.setMinTransactionForCashback(request.minTransactionAmount());
                    }
                    if (request.enabled() != null) {
                        s.setIsCashbackEnabled(request.enabled());
                    }
                }
                storeRepository.saveAll(allStores);
                log.info("Applied global cashback setting to {} stores by {}", allStores.size(), updatedBy);
            }

            log.info("Updated global TRANSACTION_CASHBACK setting by {}", updatedBy);
            return request;
        } catch (Exception e) {
            log.error("Error updating global cashback setting: {}", e.getMessage(), e);
            throw new AppException("Failed to update cashback setting: " + e.getMessage(), ApiError.INTERNAL_SERVER_ERROR, 500);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoreCashbackDto> getAllStoresCashback() {
        return storeRepository.findAll().stream()
                .map(StoreCashbackDto::fromStore)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StoreCashbackDto getStoreCashback(UUID storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException("Store not found with id: " + storeId, ApiError.STORE_NOT_FOUND, 404));
        return StoreCashbackDto.fromStore(store);
    }

    @Override
    @Transactional
    public StoreCashbackDto updateStoreCashback(UUID storeId, StoreCashbackDto request, String updatedBy) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException("Store not found with id: " + storeId, ApiError.STORE_NOT_FOUND, 404));

        if (request.cashbackPercentage() != null) {
            store.setCashbackPercentage(request.cashbackPercentage());
        }
        if (request.maxCashbackAmount() != null) {
            store.setMaxCashbackAmount(request.maxCashbackAmount());
        }
        if (request.minTransactionForCashback() != null) {
            store.setMinTransactionForCashback(request.minTransactionForCashback());
        }
        if (request.isCashbackEnabled() != null) {
            store.setIsCashbackEnabled(request.isCashbackEnabled());
        }
        store.setUpdatedBy(updatedBy);

        Store saved = storeRepository.save(store);
        log.info("Updated store cashback for storeId={} name='{}' by {}", storeId, saved.getStoreName(), updatedBy);
        return StoreCashbackDto.fromStore(saved);
    }
}
