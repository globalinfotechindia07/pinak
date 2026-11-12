package com.superapp.platform.service;

import com.superapp.platform.dto.WelcomeBonusSettingDto;

public interface WelcomeBonusSettingsService {

    WelcomeBonusSettingDto getWelcomeBonusSetting();

    WelcomeBonusSettingDto updateWelcomeBonusSetting(WelcomeBonusSettingDto request, String updatedBy);
}
