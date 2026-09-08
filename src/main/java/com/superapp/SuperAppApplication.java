package com.superapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Entry point for the SuperApp Discount & Rewards API.
 * <p>
 * Architecture: package-by-feature under com.superapp
 * - common: shared config, security, exception handling, audit, filters
 * - auth:   registration, login, token refresh, logout, password management
 * - user:   user profile management
 * Future: vendor, offer, qr, transaction, payment, reward, notification
 */
@SpringBootApplication
@EnableAsync
public class SuperAppApplication {

    public static void main(String[] args) {
        SpringApplication.run(SuperAppApplication.class, args);
    }
}
