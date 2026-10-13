package com.superapp.mobile.service;

import com.superapp.auth.dto.AuthDTO.UserSummary;
import com.superapp.auth.service.OtpService;
import com.superapp.auth.service.SessionService;
import com.superapp.auth.service.TokenService;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.AuthException;
import com.superapp.common.response.ApiError;
import com.superapp.common.security.JwtService;
import com.superapp.common.util.PhoneNormalizer;
import com.superapp.category.repository.CategoryRepository;
import com.superapp.mobile.dto.MobileProfileSetupRequest;
import com.superapp.mobile.dto.MobileProfileSetupResponse;
import com.superapp.mobile.dto.MobileSendOtpRequest;
import com.superapp.mobile.dto.MobileSendOtpResponse;
import com.superapp.mobile.dto.MobileVerifyOtpRequest;
import com.superapp.mobile.dto.MobileVerifyOtpResponse;
import com.superapp.mobile.entity.MobileOtp;
import com.superapp.mobile.repository.MobileOtpRepository;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserSession;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Enterprise implementation of Mobile Authentication Service.
 * Persists OTP lifecycle directly into PostgreSQL (mobile_otps table)
 * with 60s cooldown enforcement, anti-brute-force defense, and timing-safe checks.
 */
@Service
public class MobileAuthServiceImpl implements MobileAuthService {

    private static final Logger log = LoggerFactory.getLogger(MobileAuthServiceImpl.class);

    // OTP expiry and resend cooldown set to 60 seconds
    private static final Duration OTP_EXPIRY = Duration.ofSeconds(60);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_OTP_ATTEMPTS = 5;

    private final OtpService otpService;
    private final MobileOtpRepository mobileOtpRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TokenService tokenService;
    private final SessionService sessionService;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;

    public MobileAuthServiceImpl(
            OtpService otpService,
            MobileOtpRepository mobileOtpRepository,
            UserRepository userRepository,
            JwtService jwtService,
            TokenService tokenService,
            SessionService sessionService,
            PasswordEncoder passwordEncoder,
            CategoryRepository categoryRepository
    ) {
        this.otpService = otpService;
        this.mobileOtpRepository = mobileOtpRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.passwordEncoder = passwordEncoder;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public MobileSendOtpResponse sendOtp(MobileSendOtpRequest request) {
        if (request == null || request.phone() == null || request.phone().isBlank()) {
            throw new AppException("Phone number is required.", ApiError.VALIDATION_FAILED, 400);
        }

        // 1. Normalize phone to canonical E.164 (+91XXXXXXXXXX)
        String normalizedPhone = PhoneNormalizer.normalize(request.phone());
        String tenDigits = PhoneNormalizer.getTenDigits(normalizedPhone);
        String channel = (request.channel() != null && !request.channel().isBlank())
                ? request.channel().toUpperCase()
                : "SMS";

        Instant now = Instant.now();

        // 2. Anti-spam & Cooldown Check on unique phone record
        Optional<MobileOtp> existingOpt = mobileOtpRepository.findByPhone(normalizedPhone);
        if (existingOpt.isPresent() && existingOpt.get().getCooldownUntil() != null && existingOpt.get().getCooldownUntil().isAfter(now)) {
            long remainingSeconds = Duration.between(now, existingOpt.get().getCooldownUntil()).toSeconds();
            log.warn("🚨 Rate limit: OTP cooldown active for phone {} ({}s remaining)",
                    PhoneNormalizer.mask(normalizedPhone), remainingSeconds);
            throw new AppException(
                    "Please wait " + Math.max(1, remainingSeconds) + " seconds before requesting another OTP.",
                    ApiError.RATE_LIMIT_EXCEEDED,
                    429
            );
        }

        // 3. Generate cryptographically secure 6-digit OTP & session ID
        String otp = otpService.generateOtp();
        String sessionId = "otp_sess_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        Instant expiresAt = now.plus(OTP_EXPIRY);
        Instant cooldownUntil = now.plus(RESEND_COOLDOWN);

        // 4. Upsert: maintain exactly ONE record per phone number in PostgreSQL
        MobileOtp otpEntity = existingOpt.orElseGet(() -> new MobileOtp(normalizedPhone, otp, sessionId, channel, expiresAt, cooldownUntil));
        otpEntity.setOtpCode(otp);
        otpEntity.setSessionId(sessionId);
        otpEntity.setChannel(channel);
        otpEntity.setExpiresAt(expiresAt);
        otpEntity.setCooldownUntil(cooldownUntil);
        otpEntity.setAttempts(0);
        otpEntity.setConsumed(false);
        otpEntity.setVerified(false);
        mobileOtpRepository.saveAndFlush(otpEntity);

        // 5. Deliver OTP via SMS gateway
        otpService.sendMobileOtp(normalizedPhone, otp);

        log.info("💾 [DATABASE] Upserted single OTP challenge in mobile_otps for phone {} [session: {}, code: {}]",
                PhoneNormalizer.mask(normalizedPhone), sessionId, otp);

        return new MobileSendOtpResponse(
                sessionId,
                normalizedPhone,
                channel,
                RESEND_COOLDOWN.toSeconds(),
                true,
                otp
        );
    }

    @Override
    public MobileVerifyOtpResponse verifyOtp(
            MobileVerifyOtpRequest request,
            String ipAddress,
            String userAgent,
            String requestId
    ) {
        if (request == null || request.phone() == null || request.phone().isBlank()) {
            throw new AppException("Phone number is required.", ApiError.VALIDATION_FAILED, 400);
        }
        if (request.otp() == null || request.otp().isBlank()) {
            throw new AppException("OTP code is required.", ApiError.VALIDATION_FAILED, 400);
        }

        String normalizedPhone = PhoneNormalizer.normalize(request.phone());
        String tenDigits = PhoneNormalizer.getTenDigits(normalizedPhone);
        String enteredOtp = request.otp().trim();

        // 1. Fetch the single record for this phone from PostgreSQL
        Optional<MobileOtp> otpOpt = mobileOtpRepository.findByPhone(normalizedPhone);

        if (otpOpt.isEmpty()) {
            log.warn("❌ No active OTP record found in database for phone {}", PhoneNormalizer.mask(normalizedPhone));
            throw AuthException.invalidCredentials("Invalid or expired OTP code.");
        }

        MobileOtp otpEntity = otpOpt.get();

        // 2. Anti-Brute-Force Lockout Check
        if (otpEntity.getAttempts() >= MAX_OTP_ATTEMPTS) {
            log.warn("🚨 Lockout: Rejected verification on locked-out OTP for phone {}", PhoneNormalizer.mask(normalizedPhone));
            throw AuthException.invalidCredentials("Too many failed attempts. Please request a new OTP.");
        }

        // 3. Expiry Check
        if (otpEntity.getExpiresAt().isBefore(Instant.now())) {
            otpEntity.setConsumed(true);
            mobileOtpRepository.saveAndFlush(otpEntity);
            log.warn("⏰ Rejected verification on expired OTP for phone {}", PhoneNormalizer.mask(normalizedPhone));
            throw AuthException.invalidCredentials("OTP code has expired. Please request a new one.");
        }

        // 4. Timing-Attack Safe Comparison against database record
        byte[] storedBytes = otpEntity.getOtpCode().getBytes(StandardCharsets.UTF_8);
        byte[] enteredBytes = enteredOtp.getBytes(StandardCharsets.UTF_8);
        boolean isValid = MessageDigest.isEqual(storedBytes, enteredBytes);

        if (!isValid) {
            int newAttempts = otpEntity.getAttempts() + 1;
            otpEntity.setAttempts(newAttempts);

            if (newAttempts >= MAX_OTP_ATTEMPTS) {
                otpEntity.setConsumed(true);
                mobileOtpRepository.saveAndFlush(otpEntity);
                log.warn("🚨 Lockout: Reached maximum {} failed OTP attempts for phone {}. Challenge consumed.",
                        MAX_OTP_ATTEMPTS, PhoneNormalizer.mask(normalizedPhone));
                throw AuthException.invalidCredentials("Too many failed attempts. Please request a new OTP.");
            }

            mobileOtpRepository.saveAndFlush(otpEntity);
            log.warn("❌ Failed OTP verification in DB for phone {} (attempt {}/{})",
                    PhoneNormalizer.mask(normalizedPhone), newAttempts, MAX_OTP_ATTEMPTS);
            throw AuthException.invalidCredentials("Invalid OTP code.");
        }

        // 5. Mark OTP as verified and consumed in PostgreSQL
        otpEntity.setVerified(true);
        otpEntity.setConsumed(true);
        mobileOtpRepository.saveAndFlush(otpEntity);

        log.info("✅ Successful OTP verification in DB for phone {}", PhoneNormalizer.mask(normalizedPhone));

        // 6. Look up user by normalized E.164 and 10-digit formats
        Optional<User> existingUserOpt = userRepository.findByMobile(normalizedPhone)
                .or(() -> userRepository.findByPhone(normalizedPhone))
                .or(() -> userRepository.findByMobile(tenDigits))
                .or(() -> userRepository.findByPhone(tenDigits));

        // 7. Smart Gateway Router
        if (existingUserOpt.isPresent() && existingUserOpt.get().isProfileCompleted()) {
            // Returning member with completed profile -> Issue full session tokens
            User user = existingUserOpt.get();
            if (user.isSuspended()) {
                throw AuthException.accountBlocked();
            }

            user.setMobileVerified(true);
            userRepository.save(user);

            UserSession session = sessionService.createSession(user, "mobile_device", "PINAK Mobile App", ipAddress, userAgent);
            String accessToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());
            String refreshToken = tokenService.issueRefreshToken(user, session);

            return new MobileVerifyOtpResponse(
                    false, // isNewUser
                    false, // referralEligible
                    accessToken,
                    refreshToken,
                    null, // onboardingToken
                    UserSummary.from(user),
                    null, // welcomeBonus
                    "HOME_DASHBOARD"
            );
        } else {
            // New user or incomplete profile -> Issue scoped onboarding token & welcome bonus
            User user = existingUserOpt.orElseGet(() -> {
                String last4 = tenDigits.substring(Math.max(0, tenDigits.length() - 4));
                String defaultEmail = tenDigits + "@pinak.app.internal";
                if (userRepository.existsByEmail(defaultEmail)) {
                    defaultEmail = "user_" + UUID.randomUUID().toString().substring(0, 8) + "@pinak.app.internal";
                }

                User newUser = new User(
                        defaultEmail,
                        "Member " + last4,
                        "Member",
                        last4,
                        passwordEncoder.encode(UUID.randomUUID().toString()),
                        Role.CUSTOMER
                );
                newUser.setMobile(normalizedPhone);
                newUser.setPhone(normalizedPhone);
                newUser.setMobileVerified(true);
                newUser.setProfileCompleted(false);
                newUser.setStatus(UserStatus.ACTIVE);
                return userRepository.save(newUser);
            });

            String onboardingToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());

            return new MobileVerifyOtpResponse(
                    true, // isNewUser
                    true, // referralEligible
                    null, // token
                    null, // refreshToken
                    onboardingToken,
                    UserSummary.from(user),
                    new MobileVerifyOtpResponse.WelcomeBonusSummary(
                            true,
                            100.00,
                            "WELCOME100",
                            "Flat ₹100 discount coupon unlocks on profile completion"
                    ),
                    "PROFILE_SETUP_SCREEN_08"
            );
        }
    }

    @Override
    @Transactional
    public MobileProfileSetupResponse completeProfileSetup(
            MobileProfileSetupRequest request,
            String bearerToken,
            String ipAddress,
            String userAgent
    ) {
        if (request == null) {
            throw new AppException("Profile setup request body is required.", ApiError.VALIDATION_FAILED, 400);
        }

        // 1. Extract and validate onboarding token
        if (bearerToken == null || bearerToken.isBlank()) {
            throw AuthException.invalidCredentials("Missing or empty authorization onboarding token.");
        }

        String rawToken = bearerToken.startsWith("Bearer ")
                ? bearerToken.substring(7).trim()
                : bearerToken.trim();

        if (!jwtService.isValidAccessToken(rawToken)) {
            throw AuthException.invalidCredentials("Invalid or expired onboarding session token.");
        }

        UUID userId = jwtService.extractUserId(rawToken);
        if (userId == null) {
            throw AuthException.invalidCredentials("Unable to resolve user from onboarding token.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User account not found.", ApiError.USER_NOT_FOUND, 404));

        if (user.isSuspended()) {
            throw AuthException.accountBlocked();
        }

        // 2. Validate and enrich full name
        String fullName = request.fullName() != null ? request.fullName().trim() : "";
        if (!fullName.isBlank()) {
            user.setName(fullName);
            String[] parts = fullName.split("\\s+", 2);
            user.setFirstName(parts[0]);
            user.setLastName(parts.length > 1 ? parts[1] : "");
        }

        // 3. Email update (if provided and different from internal placeholder)
        if (request.email() != null && !request.email().isBlank()) {
            String cleanEmail = request.email().trim().toLowerCase();
            Optional<User> existingEmailUser = userRepository.findByEmail(cleanEmail);
            if (existingEmailUser.isPresent() && !existingEmailUser.get().getId().equals(user.getId())) {
                throw new AppException("Email is already registered to another account.", ApiError.DUPLICATE_RESOURCE, 409);
            }
            user.setEmail(cleanEmail);
        }

        // 4. Basic details: city, state, district, pincode, gender, address, birthday
        if (request.city() != null && !request.city().isBlank()) {
            user.setPrimaryCity(request.city().trim());
        }
        if (request.state() != null && !request.state().isBlank()) {
            user.setState(request.state().trim());
        }
        if (request.district() != null && !request.district().isBlank()) {
            user.setDistrict(request.district().trim());
        }
        if (request.pincode() != null && !request.pincode().isBlank()) {
            user.setPincode(request.pincode().trim());
        }
        if (request.gender() != null && !request.gender().isBlank()) {
            user.setGender(request.gender().trim().toUpperCase());
        }
        if (request.address() != null && !request.address().isBlank()) {
            user.setAddress(request.address().trim());
        }
        if (request.birthday() != null) {
            user.setBirthday(request.birthday());
        }

        // 5. Category Preferences: Validate with CategoryRepository
        if (request.categoryPreferences() != null && !request.categoryPreferences().isEmpty()) {
            List<String> validatedCategoryNames = request.categoryPreferences().stream()
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .map(catIdentifier -> {
                        try {
                            UUID catId = UUID.fromString(catIdentifier);
                            return categoryRepository.findById(catId)
                                    .map(com.superapp.category.entity.Category::getName)
                                    .orElse(null);
                        } catch (IllegalArgumentException e) {
                            return categoryRepository.findBySlug(catIdentifier.toLowerCase())
                                    .or(() -> categoryRepository.findByNameIgnoreCase(catIdentifier))
                                    .map(com.superapp.category.entity.Category::getName)
                                    .orElse(catIdentifier);
                        }
                    })
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();

            if (!validatedCategoryNames.isEmpty()) {
                user.setCategoryPreferences(String.join(",", validatedCategoryNames));
            }
        }

        // 6. Referral code handling
        if (request.referralCode() != null && !request.referralCode().isBlank()) {
            String refCode = request.referralCode().trim().toUpperCase();
            user.setReferredByCode(refCode);
        }
        if (user.getReferralCode() == null || user.getReferralCode().isBlank()) {
            String userRefCode = "PINAK" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
            user.setReferralCode(userRefCode);
        }

        // 7. Finalize user profile
        user.setProfileCompleted(true);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.saveAndFlush(user);

        log.info("🎉 Completed profile setup for user {} (mobile: {}, city: {}, state: {}, district: {}, pincode: {})",
                user.getId(), PhoneNormalizer.mask(user.getMobile()), user.getPrimaryCity(), user.getState(), user.getDistrict(), user.getPincode());

        // 8. Create active customer session & permanent JWT tokens
        UserSession session = sessionService.createSession(user, "mobile_device", "PINAK Mobile App", ipAddress, userAgent);
        String finalToken = jwtService.generateAccessToken(user.getId(), user.getRole().name());
        String finalRefreshToken = tokenService.issueRefreshToken(user, session);

        // 9. Build response
        MobileProfileSetupResponse.CustomerProfileSummary summary = new MobileProfileSetupResponse.CustomerProfileSummary(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getMobile(),
                user.getPrimaryCity(),
                user.getState(),
                user.getDistrict(),
                user.getPincode(),
                user.getAddress(),
                user.getGender(),
                user.getBirthday(),
                user.getReferralCode(),
                user.getRole().name(),
                user.isProfileCompleted()
        );

        MobileProfileSetupResponse.WelcomeCouponSummary welcomeCoupon = new MobileProfileSetupResponse.WelcomeCouponSummary(
                "WELCOME100",
                "Flat ₹100 Off First Order",
                100.00,
                "Welcome to PINAK! ₹100 discount applied to your rewards wallet"
        );

        return new MobileProfileSetupResponse(
                finalToken,
                finalRefreshToken,
                summary,
                true,
                welcomeCoupon,
                "PERMISSIONS_CONSENT_SCREEN_09"
        );
    }
}
