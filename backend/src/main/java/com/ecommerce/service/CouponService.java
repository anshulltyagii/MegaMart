package com.ecommerce.service;

import com.ecommerce.dto.ApiResponse;
import com.ecommerce.dto.CouponRequest;
import com.ecommerce.dto.CouponResponse;
import com.ecommerce.model.Coupon;
import java.util.List;

public interface CouponService {

	CouponResponse createCoupon(CouponRequest request);

	CouponResponse updateCoupon(Long id, CouponRequest request);

	boolean deleteCoupon(Long id);

	CouponResponse getCouponById(Long id);

	List<CouponResponse> getCouponsByShop(Long shopId);

	List<CouponResponse> getAllCoupons();

	ApiResponse<Coupon> validateCoupon(String code, Long userId, Double cartTotal);
}