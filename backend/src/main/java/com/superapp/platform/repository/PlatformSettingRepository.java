package com.superapp.platform.repository;

import com.superapp.platform.entity.PlatformSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, UUID> {
    Optional<PlatformSetting> findBySettingKey(String settingKey);
}
