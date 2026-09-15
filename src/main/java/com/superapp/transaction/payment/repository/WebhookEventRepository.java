package com.superapp.transaction.payment.repository;

import com.superapp.transaction.payment.entity.WebhookEventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebhookEventRepository extends JpaRepository<WebhookEventLog, UUID> {

    boolean existsByProviderAndProviderEventId(String provider, String providerEventId);

    Optional<WebhookEventLog> findByProviderAndProviderEventId(String provider, String providerEventId);
}
