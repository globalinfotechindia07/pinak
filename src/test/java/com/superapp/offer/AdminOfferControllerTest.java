package com.superapp.offer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.offer.controller.AdminOfferController;
import com.superapp.offer.dto.MerchantOfferResponse;
import com.superapp.offer.dto.OfferApprovalResponse;
import com.superapp.offer.dto.RejectOfferRequest;
import com.superapp.offer.service.OfferService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminOfferControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock private OfferService offerService;
    @InjectMocks private AdminOfferController controller;

    private UUID adminId;
    private UUID offerId;
    private MerchantOfferResponse offerResponse;

    @BeforeEach
    void setUp() {
        adminId = UUID.randomUUID();
        offerId = UUID.randomUUID();

        offerResponse = new MerchantOfferResponse(
                offerId.toString(),
                UUID.randomUUID().toString(),
                "Store 1",
                UUID.randomUUID().toString(),
                null,
                "10% Cashback",
                "Description",
                "CASHBACK",
                BigDecimal.valueOf(10),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(500),
                1000,
                1,
                Instant.now(),
                Instant.now().plus(30, ChronoUnit.DAYS),
                "PENDING_APPROVAL",
                "PENDING_APPROVAL",
                null,
                null,
                Instant.now(),
                Instant.now()
        );

        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User(adminId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(authPrincipalResolver, new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/offers returns 200 with list and meta")
    void getAllOffers_success() throws Exception {
        when(offerService.getAdminOffers(any(), any()))
                .thenReturn(new PageImpl<>(List.of(offerResponse), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/admin/offers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(offerId.toString()))
                .andExpect(jsonPath("$.meta.totalElements").value(1));
    }

    @Test
    @DisplayName("POST /api/v1/admin/offers/{id}/approve returns 200 with APPROVED status")
    void approveOffer_success() throws Exception {
        when(offerService.approveOffer(offerId, adminId))
                .thenReturn(OfferApprovalResponse.approved(offerId.toString()));

        mockMvc.perform(post("/api/v1/admin/offers/" + offerId + "/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer approved successfully"))
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /api/v1/admin/offers/{id}/reject returns 200 with REJECTED status and reason")
    void rejectOffer_success() throws Exception {
        RejectOfferRequest request = new RejectOfferRequest("Terms are incomplete");
        when(offerService.rejectOffer(eq(offerId), any(), eq(adminId)))
                .thenReturn(OfferApprovalResponse.rejected(offerId.toString(), "Terms are incomplete"));

        mockMvc.perform(post("/api/v1/admin/offers/" + offerId + "/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer rejected successfully"))
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"))
                .andExpect(jsonPath("$.data.reason").value("Terms are incomplete"));
    }

    @Test
    @DisplayName("POST /api/v1/admin/offers/{id}/reject without reason fails validation with 400")
    void rejectOffer_blankReason_failsValidation() throws Exception {
        RejectOfferRequest request = new RejectOfferRequest("");

        mockMvc.perform(post("/api/v1/admin/offers/" + offerId + "/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
