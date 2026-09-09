package com.superapp.redemption;

import com.superapp.common.exception.AppException;
import com.superapp.redemption.dto.CreateRedemptionRequest;
import com.superapp.redemption.dto.RedemptionResponse;
import com.superapp.redemption.entity.OfferRedemption;
import com.superapp.redemption.entity.RedemptionStatus;
import com.superapp.redemption.repository.OfferRedemptionRepository;
import com.superapp.redemption.service.RedemptionServiceImpl;
import com.superapp.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RedemptionServiceTest {

    @Mock private OfferRedemptionRepository redemptionRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private RedemptionServiceImpl redemptionService;

    private UUID customerId;
    private UUID offerId;
    private UUID storeId;
    private UUID redemptionId;
    private OfferRedemption redemption;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        offerId = UUID.randomUUID();
        storeId = UUID.randomUUID();
        redemptionId = UUID.randomUUID();

        redemption = new OfferRedemption(
                offerId,
                customerId,
                storeId,
                new BigDecimal("1000.00"),
                new BigDecimal("150.00"),
                new BigDecimal("850.00"),
                null
        );
        redemption.setId(redemptionId);
    }

    @Test
    @DisplayName("Create redemption calculates discount and payable amount accurately")
    void createRedemption_success() {
        CreateRedemptionRequest request = new CreateRedemptionRequest(
                offerId,
                storeId,
                new BigDecimal("1000.00"),
                new BigDecimal("15.0")
        );

        when(userRepository.existsById(customerId)).thenReturn(true);
        when(redemptionRepository.save(any(OfferRedemption.class))).thenAnswer(inv -> {
            OfferRedemption r = inv.getArgument(0);
            r.setId(redemptionId);
            return r;
        });

        RedemptionResponse response = redemptionService.createRedemption(request, customerId);

        assertThat(response).isNotNull();
        assertThat(response.billAmount()).isEqualByComparingTo("1000.00");
        assertThat(response.discountAmount()).isEqualByComparingTo("150.00");
        assertThat(response.payableAmount()).isEqualByComparingTo("850.00");
        assertThat(response.status()).isEqualTo(RedemptionStatus.INITIATED);
    }

    @Test
    @DisplayName("Get redemption by unauthorized customer throws 403 Forbidden")
    void getRedemption_unauthorized_throwsForbidden() {
        UUID otherCustomer = UUID.randomUUID();
        when(redemptionRepository.findById(redemptionId)).thenReturn(Optional.of(redemption));

        assertThatThrownBy(() -> redemptionService.getRedemptionById(redemptionId, otherCustomer, false))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("not authorized");
    }

    @Test
    @DisplayName("Complete redemption links payment and sets status to COMPLETED")
    void completeRedemption_success() {
        UUID paymentId = UUID.randomUUID();
        when(redemptionRepository.findById(redemptionId)).thenReturn(Optional.of(redemption));
        when(redemptionRepository.save(any(OfferRedemption.class))).thenAnswer(inv -> inv.getArgument(0));

        RedemptionResponse response = redemptionService.completeRedemption(redemptionId, paymentId);

        assertThat(response.status()).isEqualTo(RedemptionStatus.COMPLETED);
        assertThat(response.paymentId()).isEqualTo(paymentId);
    }
}
