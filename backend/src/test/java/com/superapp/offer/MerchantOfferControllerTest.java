package com.superapp.offer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.offer.controller.MerchantOfferController;
import com.superapp.offer.dto.CreateOfferRequest;
import com.superapp.offer.dto.MerchantOfferResponse;
import com.superapp.offer.dto.OfferApprovalResponse;
import com.superapp.offer.dto.UpdateOfferRequest;
import com.superapp.offer.enums.OfferType;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MerchantOfferControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock private OfferService offerService;
    @InjectMocks private MerchantOfferController controller;

    private UUID ownerId;
    private UUID storeId;
    private UUID offerId;
    private MerchantOfferResponse offerResponse;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        storeId = UUID.randomUUID();
        offerId = UUID.randomUUID();

        offerResponse = new MerchantOfferResponse(
                offerId.toString(),
                storeId.toString(),
                "Foodies Branch 1",
                UUID.randomUUID().toString(),
                null,
                "10% Cashback",
                "Great dining cashback",
                "CASHBACK",
                BigDecimal.valueOf(10),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(500),
                1000,
                1,
                Instant.now(),
                Instant.now().plus(30, ChronoUnit.DAYS),
                "CREATED",
                "DRAFT",
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
                return new User(ownerId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_MERCHANT")));
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(authPrincipalResolver, new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/merchant/offers returns 201 Created")
    void createOffer_success() throws Exception {
        when(offerService.createMerchantOffer(any(), eq(ownerId))).thenReturn(offerResponse);

        CreateOfferRequest request = new CreateOfferRequest(
                storeId,
                "10% Cashback",
                "Great dining cashback",
                OfferType.CASHBACK,
                BigDecimal.valueOf(10),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(500),
                1000,
                1,
                Instant.now(),
                Instant.now().plus(30, ChronoUnit.DAYS)
        );

        mockMvc.perform(post("/api/v1/merchant/offers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer created successfully"))
                .andExpect(jsonPath("$.data.id").value(offerId.toString()))
                .andExpect(jsonPath("$.data.status").value("CREATED"))
                .andExpect(jsonPath("$.data.approvalStatus").value("DRAFT"));
    }

    @Test
    @DisplayName("GET /api/v1/merchant/offers returns 200 with list and meta")
    void getMyOffers_success() throws Exception {
        when(offerService.getMerchantOffers(any(), any(), any(), any(), eq(ownerId)))
                .thenReturn(new PageImpl<>(List.of(offerResponse), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/merchant/offers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(offerId.toString()))
                .andExpect(jsonPath("$.meta.page").value(0))
                .andExpect(jsonPath("$.meta.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/merchant/offers/{id} returns 200 with single offer")
    void getOfferById_success() throws Exception {
        when(offerService.getMerchantOfferById(offerId, ownerId)).thenReturn(offerResponse);

        mockMvc.perform(get("/api/v1/merchant/offers/" + offerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(offerId.toString()));
    }

    @Test
    @DisplayName("PUT /api/v1/merchant/offers/{id} returns 200 with updated offer")
    void updateOffer_success() throws Exception {
        when(offerService.updateMerchantOffer(eq(offerId), any(), eq(ownerId))).thenReturn(offerResponse);

        UpdateOfferRequest request = new UpdateOfferRequest(
                storeId,
                "Updated 15% Cashback",
                "New description",
                OfferType.CASHBACK,
                BigDecimal.valueOf(15),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(750),
                1000,
                1,
                Instant.now(),
                Instant.now().plus(30, ChronoUnit.DAYS)
        );

        mockMvc.perform(put("/api/v1/merchant/offers/" + offerId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer updated successfully"));
    }

    @Test
    @DisplayName("POST /api/v1/merchant/offers/{id}/submit returns 200 with PENDING_APPROVAL")
    void submitOffer_success() throws Exception {
        when(offerService.submitOfferForApproval(offerId, ownerId))
                .thenReturn(OfferApprovalResponse.submitted(offerId.toString()));

        mockMvc.perform(post("/api/v1/merchant/offers/" + offerId + "/submit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer submitted for approval"))
                .andExpect(jsonPath("$.data.approvalStatus").value("PENDING_APPROVAL"));
    }
}
