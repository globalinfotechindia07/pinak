package com.superapp.offer;

import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.offer.controller.CustomerOfferController;
import com.superapp.offer.dto.CustomerOfferDetailResponse;
import com.superapp.offer.dto.MerchantSummaryRef;
import com.superapp.offer.dto.StoreSummaryRef;
import com.superapp.offer.service.OfferService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CustomerOfferControllerTest {

    private MockMvc mockMvc;

    @Mock private OfferService offerService;
    @InjectMocks private CustomerOfferController controller;

    private UUID offerId;
    private CustomerOfferDetailResponse response;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        offerId = UUID.randomUUID();
        response = new CustomerOfferDetailResponse(
                offerId.toString(),
                new StoreSummaryRef(UUID.randomUUID().toString(), "Central Mall Store"),
                new MerchantSummaryRef(UUID.randomUUID().toString(), "Central Brands"),
                "10% Cashback",
                "Cashback on clothing",
                "CASHBACK",
                BigDecimal.valueOf(10),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(500),
                Instant.now(),
                Instant.now().plus(30, ChronoUnit.DAYS),
                "ACTIVE"
        );
    }

    @Test
    @DisplayName("GET /api/v1/offers/{id} returns 200 with offer details")
    void getOfferDetails_success() throws Exception {
        when(offerService.getCustomerOfferDetails(offerId)).thenReturn(response);

        mockMvc.perform(get("/api/v1/offers/" + offerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(offerId.toString()))
                .andExpect(jsonPath("$.data.title").value("10% Cashback"))
                .andExpect(jsonPath("$.data.merchant.name").value("Central Brands"))
                .andExpect(jsonPath("$.data.store.name").value("Central Mall Store"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("GET /api/v1/offers/{id} returns 404 when offer not found or unapproved")
    void getOfferDetails_notFound() throws Exception {
        when(offerService.getCustomerOfferDetails(offerId))
                .thenThrow(new ResourceNotFoundException("Offer not found", ApiError.OFFER_NOT_FOUND));

        mockMvc.perform(get("/api/v1/offers/" + offerId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("OFFER_NOT_FOUND"));
    }
}
