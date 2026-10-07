package com.superapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
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
@EnableCaching
public class SuperAppApplication {

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(SuperAppApplication.class, args);
    }

    private static void loadDotenv() {
        java.nio.file.Path[] paths = new java.nio.file.Path[] {
            java.nio.file.Paths.get(".env"),
            java.nio.file.Paths.get("backend", ".env"),
            java.nio.file.Paths.get("..", "backend", ".env")
        };
        for (java.nio.file.Path path : paths) {
            if (java.nio.file.Files.exists(path)) {
                try {
                    java.util.List<String> lines = java.nio.file.Files.readAllLines(path);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int idx = line.indexOf('=');
                        if (idx > 0) {
                            String key = line.substring(0, idx).trim();
                            String value = line.substring(idx + 1).trim();
                            if (!value.isEmpty() && System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    System.out.println("✅ [ENV] Loaded environment configuration from: " + path.toAbsolutePath());
                    break;
                } catch (Exception e) {
                    System.err.println("Could not load .env file from " + path + ": " + e.getMessage());
                }
            }
        }
    }
}
