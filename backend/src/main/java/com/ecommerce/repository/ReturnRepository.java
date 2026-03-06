package com.ecommerce.repository;

import com.ecommerce.model.ReturnRequest;
import java.util.List;
import java.util.Optional;

public interface ReturnRepository {

	ReturnRequest save(ReturnRequest returnRequest);

	Optional<ReturnRequest> findById(Long id);

	void update(ReturnRequest returnRequest);

	List<ReturnRequest> findByUserId(Long userId);

	boolean existsByOrderId(Long orderId);

	Optional<ReturnRequest> findByOrderId(Long orderId);

	List<ReturnRequest> findAll();
}