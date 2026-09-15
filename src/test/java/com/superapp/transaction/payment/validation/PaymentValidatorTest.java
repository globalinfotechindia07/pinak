package com.superapp.transaction.payment.validation;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.merchant.entity.ApprovalStatus;
import com.superapp.merchant.entity.Merchant;
import com.superapp.merchant.enums.MerchantStatus;
import com.superapp.merchant.repository.MerchantRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.enums.OfferType;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.enums.StoreStatus;
import com.superapp.store.repository.StoreRepository;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentValidatorTest {

    @Mock private UserRepository userRepository;
    @Mock private MerchantRepository merchantRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private OfferRepository offerRepository;

    @InjectMocks private PaymentValidator paymentValidator;

    private UUID customerId;
    private UUID merchantId;
    private UUID storeId;
    private UUID offerId;
    private User customer;
    private Merchant merchant;
    private Store store;
    private Offer offer;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        merchantId = UUID.randomUUID();
        storeId = UUID.randomUUID();
        offerId = UUID.randomUUID();

        customer = new User();
        customer.setId(customerId);
        customer.setRole(Role.CUSTOMER);
        customer.setStatus(UserStatus.ACTIVE);

        merchant = new Merchant();
        merchant.setId(merchantId);
        merchant.setStatus(MerchantStatus.ACTIVE);
        merchant.setApprovalStatus(ApprovalStatus.APPROVED);

        store = new Store();
        store.setId(storeId);
        store.setMerchantId(merchantId);
        store.setStatus(StoreStatus.ACTIVE);
        store.setApprovalStatus(ApprovalStatus.APPROVED);

        offer = new Offer();
        offer.setId(offerId);
        offer.setMerchantId(merchantId);
        offer.setStoreId(storeId);
        offer.setStatus(OfferStatus.ACTIVE);
        offer.setApprovalStatus(OfferApprovalStatus.APPROVED);
        offer.setType(OfferType.PERCENTAGE_DISCOUNT);
        offer.setValidFrom(Instant.now().minus(1, ChronoUnit.DAYS));
        offer.setValidTo(Instant.now().plus(1, ChronoUnit.DAYS));
    }

    @Test
    @DisplayName("Validation succeeds when all entities are valid and active")
    void testValidationSuccess() {
        when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));

        var result = paymentValidator.validatePaymentInitiation(customerId, storeId, offerId);

        assertThat(result.customer()).isEqualTo(customer);
        assertThat(result.merchant()).isEqualTo(merchant);
        assertThat(result.store()).isEqualTo(store);
        assertThat(result.offer()).isEqualTo(offer);
    }

    @Test
    @DisplayName("Validation fails when user is not CUSTOMER role")
    void testNonCustomerFails() {
        customer.setRole(Role.MERCHANT);
        when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));

        assertThatThrownBy(() -> paymentValidator.validatePaymentInitiation(customerId, storeId, null))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.FORBIDDEN);
    }

    @Test
    @DisplayName("Validation fails when store is not approved")
    void testUnapprovedStoreFails() {
        store.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

        assertThatThrownBy(() -> paymentValidator.validatePaymentInitiation(customerId, storeId, null))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.INVALID_STORE_STATE);
    }

    @Test
    @DisplayName("Validation fails when offer belongs to another store")
    void testOfferStoreMismatchFails() {
        offer.setStoreId(UUID.randomUUID()); // Different store
        when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));

        assertThatThrownBy(() -> paymentValidator.validatePaymentInitiation(customerId, storeId, offerId))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.OFFER_NOT_ELIGIBLE);
    }

    @Test
    @DisplayName("Validation fails when offer has expired")
    void testExpiredOfferFails() {
        offer.setValidTo(Instant.now().minus(1, ChronoUnit.HOURS)); // expired
        when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(merchant));
        when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));

        assertThatThrownBy(() -> paymentValidator.validatePaymentInitiation(customerId, storeId, offerId))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.OFFER_NOT_ELIGIBLE);
    }
}
