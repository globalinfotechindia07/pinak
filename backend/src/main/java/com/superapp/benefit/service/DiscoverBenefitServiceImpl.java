package com.superapp.benefit.service;

import com.superapp.benefit.dto.DiscoverBenefitItemDto;
import com.superapp.benefit.dto.DiscoverBenefitsResponse;
import com.superapp.benefit.entity.DiscoverBenefit;
import com.superapp.benefit.repository.DiscoverBenefitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DiscoverBenefitServiceImpl implements DiscoverBenefitService {

    private final DiscoverBenefitRepository benefitRepository;

    public DiscoverBenefitServiceImpl(DiscoverBenefitRepository benefitRepository) {
        this.benefitRepository = benefitRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DiscoverBenefitsResponse getDiscoverBenefits() {
        List<DiscoverBenefit> benefits = benefitRepository.findActiveBenefits();
        List<DiscoverBenefitItemDto> dtos = benefits.stream().map(b -> new DiscoverBenefitItemDto(
                b.getId().toString(),
                b.getTitle(),
                b.getSubtitle(),
                b.getIconName(),
                b.getDisplayOrder()
        )).toList();

        return new DiscoverBenefitsResponse(dtos);
    }
}
