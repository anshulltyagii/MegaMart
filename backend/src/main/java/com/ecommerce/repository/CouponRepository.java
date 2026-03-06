package com.ecommerce.repository;

import com.ecommerce.model.Coupon;
import java.util.List;
import java.util.Optional;

public interface CouponRepository {

	Long save(Coupon coupon);

	Coupon update(Coupon coupon);

	Optional<Coupon> findById(Long id);

	List<Coupon> findByShopId(Long shopId);

	boolean softDelete(Long id);

	List<Coupon> findAll();

	Optional<Coupon> findByCode(String code);

	void recordUsage(Long userId, Long couponId, Long orderId);

	boolean isUsedByUser(Long userId, Long couponId);
}