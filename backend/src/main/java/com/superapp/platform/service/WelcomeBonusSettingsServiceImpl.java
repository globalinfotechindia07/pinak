package com.superapp.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.platform.dto.WelcomeBonusSettingDto;
import com.superapp.platform.entity.PlatformSetting;
import com.superapp.platform.repository.PlatformSettingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WelcomeBonusSettingsServiceImpl implements WelcomeBonusSettingsService {

    private static final Logger log = LoggerFactory.getLogger(WelcomeBonusSettingsServiceImpl.class);
    public static final String SETTING_KEY = "FIRST_TIME_USER_WELCOME_BONUS";

    private final PlatformSettingRepository platformSettingRepository;
    private final ObjectMapper objectMapper;

    public WelcomeBonusSettingsServiceImpl(
            PlatformSettingRepository platformSettingRepository,
            ObjectMapper objectMapper) {
        this.platformSettingRepository = platformSettingRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public WelcomeBonusSettingDto getWelcomeBonusSetting() {
        return platformSettingRepository.findBySettingKey(SETTING_KEY)
                .map(setting -> {
                    try {
                        return objectMapper.readValue(setting.getSettingValue(), WelcomeBonusSettingDto.class);
                    } catch (Exception e) {
                        log.warn("Failed to parse FIRST_TIME_USER_WELCOME_BONUS setting: {}", e.getMessage());
                        return WelcomeBonusSettingDto.defaults();
                    }
                })
                .orElse(WelcomeBonusSettingDto.defaults());
    }

    @Override
    @Transactional
    public WelcomeBonusSettingDto updateWelcomeBonusSetting(WelcomeBonusSettingDto request, String updatedBy) {
        try {
            WelcomeBonusSettingDto effective = request != null ? request : WelcomeBonusSettingDto.defaults();
            String json = objectMapper.writeValueAsString(effective);
            PlatformSetting setting = platformSettingRepository.findBySettingKey(SETTING_KEY)
                    .orElseGet(() -> new PlatformSetting(
                            SETTING_KEY, json,
                            "Welcome Bonus coins policy for first-time users managed by Super Admin",
                            updatedBy
                    ));

            setting.setSettingValue(json);
            setting.setUpdatedBy(updatedBy);
            platformSettingRepository.save(setting);

            log.info("Super Admin {} updated First-Time Welcome Bonus setting: enabled={}, coins={}, couponCode={}",
                    updatedBy, effective.enabled(), effective.coins(), effective.couponCode());

            return effective;
        } catch (Exception e) {
            log.error("Failed to update FIRST_TIME_USER_WELCOME_BONUS setting: {}", e.getMessage());
            throw new RuntimeException("Could not update welcome bonus setting", e);
        }
    }
}
