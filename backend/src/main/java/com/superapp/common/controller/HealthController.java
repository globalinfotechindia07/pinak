package com.superapp.common.controller;

import com.superapp.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * System health check endpoint.
 * Does not require authentication (used by load balancers and monitoring).
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "System", description = "System health and status")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "System health check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> data = Map.of(
                "status", "UP",
                "timestamp", Instant.now().toString(),
                "service", "SuperApp API"
        );
        return ResponseEntity.ok(ApiResponse.success("Service is healthy", data));
    }
}
