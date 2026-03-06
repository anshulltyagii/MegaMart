package com.ecommerce.service;

import com.ecommerce.dto.AdminLogResponse;
import com.ecommerce.dto.CouponRequest;
import com.ecommerce.dto.CouponResponse;
import com.ecommerce.dto.ShopResponse;
import com.ecommerce.dto.UserResponse;

import java.util.List;

public interface AdminService {

	List<UserResponse> getAllUsers(Long adminUserId);

	UserResponse getUserById(Long adminUserId, Long userId);

	boolean updateUserStatus(Long adminUserId, Long userId, String status);

	void deleteUser(Long adminUserId, Long userId);

	List<ShopResponse> getAllShops(Long adminUserId);

	List<ShopResponse> getPendingShops(Long adminUserId);

	List<ShopResponse> getEveryShop(Long adminUserId);

	ShopResponse getShopById(Long adminUserId, Long shopId);

	boolean approveShop(Long adminUserId, Long shopId);

	boolean rejectShop(Long adminUserId, Long shopId);

	boolean softDeleteShop(Long adminUserId, Long shopId);

	CouponResponse createCoupon(Long adminUserId, CouponRequest request);

	CouponResponse updateCoupon(Long adminUserId, Long couponId, CouponRequest request);

	boolean deleteCoupon(Long adminUserId, Long couponId);

	List<CouponResponse> getAllCoupons(Long adminUserId);

	List<AdminLogResponse> getRecentAdminLogs(int limit);

	void logAction(Long adminUserId, String action);

}
