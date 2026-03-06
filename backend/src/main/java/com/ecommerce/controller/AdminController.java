package com.ecommerce.controller;

import com.ecommerce.dto.CouponRequest;
import com.ecommerce.dto.CouponResponse;
import com.ecommerce.dto.ShopResponse;
import com.ecommerce.dto.UserResponse;
import com.ecommerce.enums.UserRole;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.model.User;
import com.ecommerce.repository.AdminLogsRepository;
import com.ecommerce.service.AdminService;
import com.ecommerce.service.impl.DtoMapper;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	@Autowired
	private AdminService adminService;

	@Autowired
	private AdminLogsRepository adminLogsRepository;

	private Long checkAndGetAdmin(HttpServletRequest req) {
		User currentUser = (User) req.getAttribute("currentUser");

		if (currentUser == null) {
			throw new BadRequestException("unauthorized request");
		}

		if (currentUser.getRole() != UserRole.ADMIN) {
			throw new BadRequestException("Access denied! Admin only");
		}

		return currentUser.getId();
	}

	@GetMapping("/users")
	public ResponseEntity<List<UserResponse>> getAllUsers(HttpServletRequest req) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.getAllUsers(adminUserId));
	}

	@GetMapping("/users/{userId}")
	public ResponseEntity<UserResponse> getUserById(HttpServletRequest req, @PathVariable Long userId) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.getUserById(adminUserId, userId));
	}

	@PatchMapping("/users/{userId}/status")
	public ResponseEntity<?> updateUserStatus(HttpServletRequest req, @PathVariable Long userId,
			@RequestParam String status) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.updateUserStatus(adminUserId, userId, status));
	}

	@DeleteMapping("/users/{userId}")
	public ResponseEntity<?> deleteUser(HttpServletRequest req, @PathVariable Long userId) {
		Long adminUserId = checkAndGetAdmin(req);
		adminService.deleteUser(adminUserId, userId);
		return ResponseEntity.ok("User deleted successfully");
	}

	@GetMapping("/shops")
	public ResponseEntity<List<ShopResponse>> getAllShops(HttpServletRequest req) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.getAllShops(adminUserId));
	}

	@GetMapping("/allshops")
	public ResponseEntity<List<ShopResponse>> getDeletedShopsAlso(HttpServletRequest req) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.getEveryShop(adminUserId));
	}

	@GetMapping("/shops/{shopId}")
	public ResponseEntity<ShopResponse> getShopById(HttpServletRequest req, @PathVariable Long shopId) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.getShopById(adminUserId, shopId));
	}

	@GetMapping("/shops/pending")
	public ResponseEntity<List<ShopResponse>> getPendingShops(HttpServletRequest req) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.getPendingShops(adminUserId));
	}

	@PatchMapping("/shops/{shopId}/approve")
	public ResponseEntity<?> approveShop(HttpServletRequest req, @PathVariable Long shopId) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.approveShop(adminUserId, shopId));
	}

	@PatchMapping("/shops/{shopId}/reject")
	public ResponseEntity<?> rejectShop(HttpServletRequest req, @PathVariable Long shopId) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.rejectShop(adminUserId, shopId));
	}

	@DeleteMapping("/shops/{shopId}")
	public ResponseEntity<?> deleteShop(HttpServletRequest req, @PathVariable Long shopId) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.softDeleteShop(adminUserId, shopId));
	}

	@PostMapping("/coupons")
	public ResponseEntity<CouponResponse> createCoupon(HttpServletRequest request, @RequestBody CouponRequest req) {
		Long adminUserId = checkAndGetAdmin(request);
		return ResponseEntity.ok(adminService.createCoupon(adminUserId, req));
	}

	@PutMapping("/coupons/{id}")
	public ResponseEntity<CouponResponse> updateCoupon(HttpServletRequest request, @PathVariable Long id,
			@RequestBody CouponRequest req) {
		Long adminUserId = checkAndGetAdmin(request);
		return ResponseEntity.ok(adminService.updateCoupon(adminUserId, id, req));
	}

	@DeleteMapping("/coupons/{id}")
	public ResponseEntity<?> deleteCoupon(HttpServletRequest req, @PathVariable Long id) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.deleteCoupon(adminUserId, id));
	}

	@GetMapping("/coupons")
	public ResponseEntity<List<CouponResponse>> listCoupons(HttpServletRequest req) {
		Long adminUserId = checkAndGetAdmin(req);
		return ResponseEntity.ok(adminService.getAllCoupons(adminUserId));
	}

	@GetMapping("/logs")
	public ResponseEntity<?> getLogs(HttpServletRequest req, @RequestParam(defaultValue = "20") int limit) {
		return ResponseEntity
				.ok(adminLogsRepository.findRecent(limit).stream().map(DtoMapper::adminLogToResponse).toList());
	}

}