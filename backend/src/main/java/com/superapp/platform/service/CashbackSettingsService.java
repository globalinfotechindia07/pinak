package com.superapp.platform.service;

import com.superapp.platform.dto.CashbackSettingDto;
import com.superapp.platform.dto.StoreCashbackDto;

import java.util.List;
import java.util.UUID;

public interface CashbackSettingsService {
    CashbackSettingDto getGlobalCashbackSetting();

    CashbackSettingDto updateGlobalCashbackSetting(CashbackSettingDto request, String updatedBy);

    List<StoreCashbackDto> getAllStoresCashback();

    StoreCashbackDto getStoreCashback(UUID storeId);

    StoreCashbackDto updateStoreCashback(UUID storeId, StoreCashbackDto request, String updatedBy);
}
