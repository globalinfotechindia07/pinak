package com.superapp.mobile.repository;

import com.superapp.mobile.entity.MobileOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MobileOtpRepository extends JpaRepository<MobileOtp, UUID> {

    /**
     * Finds the unique OTP record for a phone number.
     */
    Optional<MobileOtp> findByPhone(String phone);

    /**
     * Checks if there is an active cooldown timer for the phone number.
     */
    Optional<MobileOtp> findByPhoneAndCooldownUntilAfter(String phone, Instant now);
}
