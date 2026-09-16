package com.superapp.transaction.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.transaction.notification.controller.NotificationController;
import com.superapp.transaction.notification.dto.*;
import com.superapp.transaction.notification.enums.NotificationType;
import com.superapp.transaction.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationControllerUnitTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private static final String USER_ID = "11111111-1111-1111-1111-111111111111";

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver userAuthResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User(USER_ID, "secret", Collections.singletonList(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(notificationController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver(), userAuthResolver)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/notifications should return paginated list")
    void testGetUserNotifications_Success() throws Exception {
        UUID notifId = UUID.randomUUID();
        NotificationResponse item = new NotificationResponse(
                notifId,
                NotificationType.PAYMENT_SUCCESS,
                "Payment Successful",
                "Your payment of ₹500 was successful",
                "PAYMENT",
                "PAY-123",
                false,
                Instant.now()
        );

        when(notificationService.getUserNotifications(eq(UUID.fromString(USER_ID)), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(item), org.springframework.data.domain.PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/notifications?page=0&size=20&isRead=false")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(notifId.toString()))
                .andExpect(jsonPath("$.data.content[0].type").value("PAYMENT_SUCCESS"))
                .andExpect(jsonPath("$.data.content[0].isRead").value(false));
    }

    @Test
    @DisplayName("GET /api/v1/notifications/{id} should return detail response")
    void testGetNotification_Success() throws Exception {
        UUID notifId = UUID.randomUUID();
        NotificationDetailResponse detail = new NotificationDetailResponse(
                notifId,
                NotificationType.REWARD_CREDITED,
                "Reward Credited",
                "₹50 reward credited",
                "REWARD",
                "RLE-123",
                true,
                Instant.now(),
                Instant.now()
        );

        when(notificationService.getNotification(eq(notifId), eq(UUID.fromString(USER_ID))))
                .thenReturn(detail);

        mockMvc.perform(get("/api/v1/notifications/" + notifId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(notifId.toString()))
                .andExpect(jsonPath("$.data.type").value("REWARD_CREDITED"))
                .andExpect(jsonPath("$.data.isRead").value(true));
    }

    @Test
    @DisplayName("PATCH /api/v1/notifications/{id}/read should mark notification as read")
    void testMarkAsRead_Success() throws Exception {
        UUID notifId = UUID.randomUUID();
        MarkReadResponse response = new MarkReadResponse(notifId, true, Instant.now());

        when(notificationService.markAsRead(eq(notifId), eq(UUID.fromString(USER_ID))))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/notifications/" + notifId + "/read")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(notifId.toString()))
                .andExpect(jsonPath("$.data.isRead").value(true));
    }

    @Test
    @DisplayName("PATCH /api/v1/notifications/read-all should mark all as read and return updatedCount")
    void testMarkAllAsRead_Success() throws Exception {
        MarkAllReadResponse response = new MarkAllReadResponse(8);

        when(notificationService.markAllAsRead(eq(UUID.fromString(USER_ID))))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/notifications/read-all")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.updatedCount").value(8));
    }

    @Test
    @DisplayName("GET /api/v1/notifications/unread-count should return unreadCount")
    void testGetUnreadCount_Success() throws Exception {
        UnreadCountResponse response = new UnreadCountResponse(5);

        when(notificationService.getUnreadCount(eq(UUID.fromString(USER_ID))))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.unreadCount").value(5));
    }

    @Test
    @DisplayName("GET /api/v1/notifications/preferences should return user preferences")
    void testGetPreferences_Success() throws Exception {
        NotificationPreferenceResponse response = new NotificationPreferenceResponse(
                true, true, false, true, Instant.now()
        );

        when(notificationService.getPreferences(eq(UUID.fromString(USER_ID))))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/notifications/preferences")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentNotifications").value(true))
                .andExpect(jsonPath("$.data.offerNotifications").value(false));
    }

    @Test
    @DisplayName("PUT /api/v1/notifications/preferences should update preferences")
    void testUpdatePreferences_Success() throws Exception {
        UpdateNotificationPreferenceRequest request = new UpdateNotificationPreferenceRequest(
                true, false, false, true
        );
        NotificationPreferenceResponse response = new NotificationPreferenceResponse(
                true, false, false, true, Instant.now()
        );

        when(notificationService.updatePreferences(eq(UUID.fromString(USER_ID)), any(UpdateNotificationPreferenceRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/notifications/preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rewardNotifications").value(false));
    }
}
