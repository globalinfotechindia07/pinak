package com.example.auth.config;

import com.example.auth.entity.Role;
import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seeds default administrator and standard user accounts if they do not exist.
 */
@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Admin User
            if (!userRepository.existsByEmail("admin@example.com")) {
                User admin = new User(
                        "admin@example.com",
                        passwordEncoder.encode("Admin@123"),
                        "Admin",
                        "Superuser",
                        Role.ADMIN
                );
                userRepository.save(admin);
                log.info("Default ADMIN user created: admin@example.com / Admin@123");
            }

            // Seed Regular User
            if (!userRepository.existsByEmail("user@example.com")) {
                User user = new User(
                        "user@example.com",
                        passwordEncoder.encode("User@123"),
                        "John",
                        "Doe",
                        Role.USER
                );
                userRepository.save(user);
                log.info("Default USER user created: user@example.com / User@123");
            }
        };
    }
}
