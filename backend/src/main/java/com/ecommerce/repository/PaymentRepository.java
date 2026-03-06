package com.ecommerce.repository;

import java.util.Optional;

import com.ecommerce.model.Payment;

public interface PaymentRepository {
	Payment save(Payment payment);

	Optional<Payment> findByOrderId(Long orderId);
}