package com.superapp.merchant.mapper;

import com.superapp.merchant.dto.MerchantResponse;
import com.superapp.merchant.entity.Merchant;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting Merchant entities to safe external DTO representations.
 * Ensures JPA entities are never exposed directly to controllers.
 */
@Component
public class MerchantMapper {

    public MerchantResponse toResponse(Merchant merchant) {
        return MerchantResponse.fromEntity(merchant, null);
    }

    public MerchantResponse toResponse(Merchant merchant, String categoryName) {
        return MerchantResponse.fromEntity(merchant, categoryName);
    }
}
