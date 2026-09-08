package com.superapp.common.config;

import com.superapp.common.exception.RateLimitException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiting service using Bucket4j.
 * <p>
 * Buckets are keyed by "{endpoint}:{ip}" to isolate limits per endpoint per client.
 * <p>
 * Architecture note: Redis-backed Bucket4j can replace the ConcurrentHashMap here
 * in the future for multi-instance deployments without changing any calling code.
 */
@Service
public class RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitService.class);

    // Endpoint keys (must match callers)
    public static final String LOGIN         = "login";
    public static final String REGISTER      = "register";
    public static final String FORGOT_PWD    = "forgot-password";
    public static final String OTP_VERIFY    = "otp-verify";
    public static final String REFRESH       = "refresh";
    public static final String RESEND        = "resend";

    // Per-endpoint bucket configs loaded from application.properties
    private final long loginCapacity;
    private final long loginRefillTokens;
    private final long loginRefillMinutes;

    private final long registerCapacity;
    private final long registerRefillTokens;
    private final long registerRefillMinutes;

    private final long forgotPwdCapacity;
    private final long forgotPwdRefillTokens;
    private final long forgotPwdRefillMinutes;

    private final long otpCapacity;
    private final long otpRefillTokens;
    private final long otpRefillMinutes;

    private final long refreshCapacity;
    private final long refreshRefillTokens;
    private final long refreshRefillMinutes;

    /** Shared cache of buckets. Key format: "{endpoint}:{ip}" */
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitService(
            @Value("${app.rate-limit.login.capacity:5}") long loginCapacity,
            @Value("${app.rate-limit.login.refill-tokens:5}") long loginRefillTokens,
            @Value("${app.rate-limit.login.refill-minutes:15}") long loginRefillMinutes,
            @Value("${app.rate-limit.register.capacity:10}") long registerCapacity,
            @Value("${app.rate-limit.register.refill-tokens:10}") long registerRefillTokens,
            @Value("${app.rate-limit.register.refill-minutes:60}") long registerRefillMinutes,
            @Value("${app.rate-limit.forgot-password.capacity:3}") long forgotPwdCapacity,
            @Value("${app.rate-limit.forgot-password.refill-tokens:3}") long forgotPwdRefillTokens,
            @Value("${app.rate-limit.forgot-password.refill-minutes:60}") long forgotPwdRefillMinutes,
            @Value("${app.rate-limit.otp.capacity:5}") long otpCapacity,
            @Value("${app.rate-limit.otp.refill-tokens:5}") long otpRefillTokens,
            @Value("${app.rate-limit.otp.refill-minutes:15}") long otpRefillMinutes,
            @Value("${app.rate-limit.refresh.capacity:20}") long refreshCapacity,
            @Value("${app.rate-limit.refresh.refill-tokens:20}") long refreshRefillTokens,
            @Value("${app.rate-limit.refresh.refill-minutes:15}") long refreshRefillMinutes
    ) {
        this.loginCapacity = loginCapacity;
        this.loginRefillTokens = loginRefillTokens;
        this.loginRefillMinutes = loginRefillMinutes;
        this.registerCapacity = registerCapacity;
        this.registerRefillTokens = registerRefillTokens;
        this.registerRefillMinutes = registerRefillMinutes;
        this.forgotPwdCapacity = forgotPwdCapacity;
        this.forgotPwdRefillTokens = forgotPwdRefillTokens;
        this.forgotPwdRefillMinutes = forgotPwdRefillMinutes;
        this.otpCapacity = otpCapacity;
        this.otpRefillTokens = otpRefillTokens;
        this.otpRefillMinutes = otpRefillMinutes;
        this.refreshCapacity = refreshCapacity;
        this.refreshRefillTokens = refreshRefillTokens;
        this.refreshRefillMinutes = refreshRefillMinutes;
    }

    /**
     * Checks and consumes one token from the rate limit bucket for this endpoint + IP.
     * Throws {@link RateLimitException} if the bucket is exhausted.
     */
    public void checkLimit(String endpoint, String clientIp) {
        String key = endpoint + ":" + clientIp;
        Bucket bucket = buckets.computeIfAbsent(key, k -> buildBucket(endpoint));

        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for endpoint={} ip={}", endpoint, clientIp);
            throw RateLimitException.tooManyAttempts(endpoint);
        }
    }

    private Bucket buildBucket(String endpoint) {
        Bandwidth limit = switch (endpoint) {
            case LOGIN     -> buildBandwidth(loginCapacity, loginRefillTokens, loginRefillMinutes);
            case REGISTER  -> buildBandwidth(registerCapacity, registerRefillTokens, registerRefillMinutes);
            case FORGOT_PWD -> buildBandwidth(forgotPwdCapacity, forgotPwdRefillTokens, forgotPwdRefillMinutes);
            case OTP_VERIFY, RESEND -> buildBandwidth(otpCapacity, otpRefillTokens, otpRefillMinutes);
            case REFRESH   -> buildBandwidth(refreshCapacity, refreshRefillTokens, refreshRefillMinutes);
            default        -> buildBandwidth(10, 10, 60);
        };
        return Bucket.builder().addLimit(limit).build();
    }

    private Bandwidth buildBandwidth(long capacity, long refillTokens, long refillMinutes) {
        return Bandwidth.classic(capacity, Refill.intervally(refillTokens, Duration.ofMinutes(refillMinutes)));
    }
}
