package com.superapp.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.auth.dto.LoginRequest;
import com.superapp.auth.dto.RefreshTokenRequest;
import com.superapp.auth.dto.RegisterRequest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the authentication endpoints using Testcontainers (real PostgreSQL).
 * Tests the full HTTP stack: request → filter → controller → service → database.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("superapp_test")
            .withUsername("testuser")
            .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private static String accessToken;
    private static String refreshToken;

    @BeforeAll
    static void checkDockerAvailable() {
        Assumptions.assumeTrue(
                isDockerAvailable(),
                "Docker is not available — skipping Testcontainers integration tests"
        );
    }

    private static boolean isDockerAvailable() {
        try {
            DockerClientFactory.instance().client();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // ---- Registration ----

    @Test
    @Order(1)
    @DisplayName("POST /register — success creates CUSTOMER account")
    void register_success() throws Exception {
        var request = new RegisterRequest("Test", "User", "testuser@example.com", null, "TestPass@123");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("testuser@example.com"))
                .andExpect(jsonPath("$.data.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                // Must NOT return password or tokens
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    @Order(2)
    @DisplayName("POST /register — duplicate email returns 409")
    void register_duplicateEmail() throws Exception {
        var request = new RegisterRequest("Test", "User", "testuser@example.com", null, "TestPass@123");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    @Order(3)
    @DisplayName("POST /register — validation errors return 400 with field errors")
    void register_validationErrors() throws Exception {
        var request = new RegisterRequest("", "", "not-an-email", null, "weak");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.data").isMap());
    }

    @Test
    @Order(4)
    @DisplayName("POST /login — success returns access and refresh tokens")
    void login_success() throws Exception {
        var request = new LoginRequest("testuser@example.com", "TestPass@123", "device-001", "Test Device");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.data.user.status").value("ACTIVE"))
                // Must NOT return password
                .andExpect(jsonPath("$.data.user.password").doesNotExist())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        accessToken = objectMapper.readTree(body).at("/data/accessToken").asText();
        refreshToken = objectMapper.readTree(body).at("/data/refreshToken").asText();
    }

    @Test
    @Order(5)
    @DisplayName("POST /login — wrong password returns 401 INVALID_CREDENTIALS")
    void login_wrongPassword() throws Exception {
        var request = new LoginRequest("testuser@example.com", "WrongPass@999", null, null);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("INVALID_CREDENTIALS"))
                // Must NOT say "Password is wrong" — prevents enumeration
                .andExpect(jsonPath("$.message").value(not(containsStringIgnoringCase("password"))));
    }

    @Test
    @Order(6)
    @DisplayName("POST /login — non-existing account returns 401 INVALID_CREDENTIALS (no enumeration)")
    void login_nonExistingAccount() throws Exception {
        var request = new LoginRequest("nobody@example.com", "TestPass@123", null, null);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("INVALID_CREDENTIALS"))
                // Must NOT say "Email does not exist" — prevents enumeration
                .andExpect(jsonPath("$.message").value(not(containsStringIgnoringCase("exist"))));
    }

    @Test
    @Order(7)
    @DisplayName("GET /me — returns current user with valid token")
    void me_withValidToken() throws Exception {
        Assumptions.assumeTrue(accessToken != null, "Login test must run first");

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("testuser@example.com"));
    }

    @Test
    @Order(8)
    @DisplayName("GET /me — missing token returns 401")
    void me_missingToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("UNAUTHORIZED"));
    }

    @Test
    @Order(9)
    @DisplayName("POST /refresh — valid refresh token rotates tokens")
    void refresh_success() throws Exception {
        Assumptions.assumeTrue(refreshToken != null, "Login test must run first");

        var request = new RefreshTokenRequest(refreshToken);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        String newRefreshToken = objectMapper.readTree(body).at("/data/refreshToken").asText();

        // New token must be different (rotation)
        Assertions.assertNotEquals(refreshToken, newRefreshToken);
        refreshToken = newRefreshToken; // Update for subsequent tests
    }

    @Test
    @Order(10)
    @DisplayName("POST /refresh — reused (old) refresh token triggers reuse detection")
    void refresh_reuseDetection() throws Exception {
        // Get a fresh login to get tokens
        var loginRequest = new LoginRequest("testuser@example.com", "TestPass@123", "device-002", "Device 2");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String oldRefreshToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .at("/data/refreshToken").asText();

        // Rotate once (oldRefreshToken → newToken)
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequest(oldRefreshToken))))
                .andExpect(status().isOk());

        // Try to use the old token again → should trigger reuse detection
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequest(oldRefreshToken))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("TOKEN_REUSE_DETECTED"));
    }

    @Test
    @Order(11)
    @DisplayName("POST /logout — revokes session")
    void logout_success() throws Exception {
        Assumptions.assumeTrue(accessToken != null, "Login test must run first");

        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @Order(12)
    @DisplayName("Admin endpoint returns 403 for CUSTOMER role")
    void adminEndpoint_forbiddenForCustomer() throws Exception {
        // Login fresh
        var loginRequest = new LoginRequest("testuser@example.com", "TestPass@123", "device-003", "Device 3");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();
        String customerToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .at("/data/accessToken").asText();

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    @Order(13)
    @DisplayName("POST /forgot-password — always returns success (no enumeration)")
    void forgotPassword_noEnumeration() throws Exception {
        // Non-existing account
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\": \"nobody@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @Order(14)
    @DisplayName("GET /health — returns 200 without authentication")
    void health_noAuth() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    @Order(15)
    @DisplayName("Invalid JWT signature returns 401")
    void invalidJwtSignature() throws Exception {
        String tampered = (accessToken != null ? accessToken : "invalid") + "tampered";

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(16)
    @DisplayName("Response always contains X-Request-ID header")
    void correlationIdHeader() throws Exception {
        mockMvc.perform(get("/api/v1/health")
                        .header("X-Request-ID", "my-request-id-123"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Request-ID", "my-request-id-123"));
    }

    @Test
    @Order(17)
    @DisplayName("Malformed JSON returns 400")
    void malformedJson() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not valid json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }
}
