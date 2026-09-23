package com.superapp.auth.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRequestTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Deserializes standard identifier JSON")
    void deserializeIdentifier() throws Exception {
        String json = """
                {
                  "identifier": "customer@superapp.com",
                  "password": "Password@123",
                  "deviceId": "dev-1",
                  "deviceName": "Chrome"
                }
                """;
        LoginRequest request = objectMapper.readValue(json, LoginRequest.class);
        assertThat(request.identifier()).isEqualTo("customer@superapp.com");
        assertThat(request.password()).isEqualTo("Password@123");
        assertThat(request.deviceId()).isEqualTo("dev-1");
        assertThat(request.deviceName()).isEqualTo("Chrome");
    }

    @Test
    @DisplayName("Deserializes email field as identifier")
    void deserializeEmail() throws Exception {
        String json = """
                {
                  "email": "customer@superapp.com",
                  "password": "Password@123"
                }
                """;
        LoginRequest request = objectMapper.readValue(json, LoginRequest.class);
        assertThat(request.identifier()).isEqualTo("customer@superapp.com");
        assertThat(request.password()).isEqualTo("Password@123");
    }

    @Test
    @DisplayName("Deserializes phone field as identifier")
    void deserializePhone() throws Exception {
        String json = """
                {
                  "phone": "+919876543210",
                  "password": "Password@123"
                }
                """;
        LoginRequest request = objectMapper.readValue(json, LoginRequest.class);
        assertThat(request.identifier()).isEqualTo("+919876543210");
        assertThat(request.password()).isEqualTo("Password@123");
    }

    @Test
    @DisplayName("Deserializes mobile field as identifier")
    void deserializeMobile() throws Exception {
        String json = """
                {
                  "mobile": "9876543210",
                  "password": "Password@123"
                }
                """;
        LoginRequest request = objectMapper.readValue(json, LoginRequest.class);
        assertThat(request.identifier()).isEqualTo("9876543210");
        assertThat(request.password()).isEqualTo("Password@123");
    }

    @Test
    @DisplayName("Deserializes phoneNumber field as identifier")
    void deserializePhoneNumber() throws Exception {
        String json = """
                {
                  "phoneNumber": "+919876543210",
                  "password": "Password@123"
                }
                """;
        LoginRequest request = objectMapper.readValue(json, LoginRequest.class);
        assertThat(request.identifier()).isEqualTo("+919876543210");
        assertThat(request.password()).isEqualTo("Password@123");
    }

    @Test
    @DisplayName("ForgotPasswordRequest deserializes email or phone")
    void deserializeForgotPassword() throws Exception {
        String jsonEmail = "{\"email\": \"customer@superapp.com\"}";
        ForgotPasswordRequest req1 = objectMapper.readValue(jsonEmail, ForgotPasswordRequest.class);
        assertThat(req1.identifier()).isEqualTo("customer@superapp.com");

        String jsonPhone = "{\"phone\": \"+919876543210\"}";
        ForgotPasswordRequest req2 = objectMapper.readValue(jsonPhone, ForgotPasswordRequest.class);
        assertThat(req2.identifier()).isEqualTo("+919876543210");
    }

    @Test
    @DisplayName("VerifyResetOtpRequest deserializes email or phone")
    void deserializeVerifyResetOtp() throws Exception {
        String jsonEmail = "{\"email\": \"customer@superapp.com\", \"otp\": \"123456\"}";
        VerifyResetOtpRequest req1 = objectMapper.readValue(jsonEmail, VerifyResetOtpRequest.class);
        assertThat(req1.identifier()).isEqualTo("customer@superapp.com");
        assertThat(req1.otp()).isEqualTo("123456");

        String jsonPhone = "{\"phone\": \"+919876543210\", \"otp\": \"123456\"}";
        VerifyResetOtpRequest req2 = objectMapper.readValue(jsonPhone, VerifyResetOtpRequest.class);
        assertThat(req2.identifier()).isEqualTo("+919876543210");
        assertThat(req2.otp()).isEqualTo("123456");
    }
}
