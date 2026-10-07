package com.superapp.transaction.notification.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.transaction.notification.dto.*;
import com.superapp.transaction.notification.enums.NotificationType;
import com.superapp.transaction.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "User Notifications", description = "Endpoints for viewing, managing, and configuring user notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get user notifications", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationPageResponse>> getUserNotifications(
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) NotificationType type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        Page<NotificationResponse> page = notificationService.getUserNotifications(userId, isRead, type, pageable);

        return ResponseEntity.ok(ApiResponse.success("Notifications fetched successfully", NotificationPageResponse.of(page)));
    }

    @GetMapping("/{notificationId}")
    @Operation(summary = "Get notification details", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationDetailResponse>> getNotification(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        NotificationDetailResponse response = notificationService.getNotification(notificationId, userId);

        return ResponseEntity.ok(ApiResponse.success("Notification fetched successfully", response));
    }

    @PatchMapping("/{notificationId}/read")
    @Operation(summary = "Mark notification as read", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MarkReadResponse>> markAsRead(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        MarkReadResponse response = notificationService.markAsRead(notificationId, userId);

        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", response));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MarkAllReadResponse>> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        MarkAllReadResponse response = notificationService.markAllAsRead(userId);

        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", response));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        UnreadCountResponse response = notificationService.getUnreadCount(userId);

        return ResponseEntity.ok(ApiResponse.success("Unread notification count fetched successfully", response));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get notification preferences", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationPreferenceResponse>> getPreferences(
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        NotificationPreferenceResponse response = notificationService.getPreferences(userId);

        return ResponseEntity.ok(ApiResponse.success("Notification preferences fetched successfully", response));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Update notification preferences", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationPreferenceResponse>> updatePreferences(
            @Valid @RequestBody UpdateNotificationPreferenceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        NotificationPreferenceResponse response = notificationService.updatePreferences(userId, request);

        return ResponseEntity.ok(ApiResponse.success("Notification preferences updated successfully", response));
    }
}
