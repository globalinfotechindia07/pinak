package com.superapp.redemption;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.superapp.common.exception.GlobalExceptionHandler;
import com.superapp.redemption.controller.RedemptionController;
import com.superapp.redemption.dto.CreateRedemptionRequest;
import com.superapp.redemption.dto.RedemptionResponse;
import com.superapp.redemption.entity.RedemptionStatus;
import com.superapp.redemption.service.RedemptionService;
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

import java.math.BigDecimal;
import java.time.Instant;
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
class RedemptionControllerUnitTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Mock private RedemptionService redemptionService;
    @InjectMocks private RedemptionController redemptionController;

    private UUID customerId;
    private UUID redemptionId;
    private UUID offerId;
    private RedemptionResponse redemptionResponse;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        redemptionId = UUID.randomUUID();
        offerId = UUID.randomUUID();

        redemptionResponse = new RedemptionResponse(
                redemptionId, offerId, customerId, null,
                new BigDecimal("1000.00"), new BigDecimal("100.00"), new BigDecimal("900.00"),
                null, RedemptionStatus.INITIATED, Instant.now(), Instant.now()
        );

        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new User(customerId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(redemptionController)
                .setCustomArgumentResolvers(authPrincipalResolver, new PageableHandlerMethodArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/redemptions creates redemption and returns 201 CREATED")
    void createRedemption_success() throws Exception {
        CreateRedemptionRequest request = new CreateRedemptionRequest(
                offerId, null, new BigDecimal("1000.00"), new BigDecimal("10.0")
        );

        when(redemptionService.createRedemption(any(CreateRedemptionRequest.class), eq(customerId)))
                .thenReturn(redemptionResponse);

        mockMvc.perform(post("/api/v1/redemptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.billAmount").value(1000.00))
                .andExpect(jsonPath("$.data.discountAmount").value(100.00))
                .andExpect(jsonPath("$.data.payableAmount").value(900.00))
                .andExpect(jsonPath("$.data.status").value("INITIATED"));
    }

    @Test
    @DisplayName("GET /api/v1/redemptions/{id} returns redemption with 200 OK")
    void getRedemptionById_success() throws Exception {
        when(redemptionService.getRedemptionById(eq(redemptionId), eq(customerId), eq(false)))
                .thenReturn(redemptionResponse);

        mockMvc.perform(get("/api/v1/redemptions/" + redemptionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(redemptionId.toString()));
    }

    @Test
    @DisplayName("GET /api/v1/redemptions/me returns customer's redemptions with 200 OK")
    void getMyRedemptions_success() throws Exception {
        when(redemptionService.getCustomerRedemptions(eq(customerId), any()))
                .thenReturn(new PageImpl<>(List.of(redemptionResponse), org.springframework.data.domain.PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/redemptions/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(redemptionId.toString()));
    }
}
