package com.ecommerce.controller;

import com.ecommerce.dto.ShopRequest;
import com.ecommerce.dto.ShopResponse;
import com.ecommerce.enums.UserRole;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.model.User;
import com.ecommerce.service.ShopService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shops")
public class ShopController {

	@Autowired
	private ShopService service;

	private void checkAccess(Long ownerUserId, HttpServletRequest req) {

		Long currentUserId = (Long) req.getAttribute("currentUserId");
		User currentUser = (User) req.getAttribute("currentUser");

		if (currentUser == null) {
			throw new BadRequestException("Unauthorized request");
		}

		boolean isUser = (ownerUserId != null && ownerUserId.equals(currentUserId));
		boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
		boolean isShopKeeper = currentUser.getRole() == UserRole.SHOPKEEPER;

		if (!isUser && !isAdmin && !isShopKeeper) {
			throw new BadRequestException("Access denied! you are not allowed to perform this action");
		}

	}

	@PostMapping
	public ResponseEntity<ShopResponse> create(@RequestBody ShopRequest req, HttpServletRequest request) {
		User currentUser = (User) request.getAttribute("currentUser");
		if (currentUser.getRole() != UserRole.SHOPKEEPER) {
			throw new BadRequestException("Only shopkeepers can create a shop!");
		}
		req.setOwnerUserId(currentUser.getId());
		return ResponseEntity.ok(service.createShop(req));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ShopResponse> get(@PathVariable Long id) {
		return ResponseEntity.ok(service.getShopById(id));
	}

	@GetMapping
	public ResponseEntity<List<ShopResponse>> getAll(HttpServletRequest req) {
		User currentUser = (User) req.getAttribute("currentUser");

		if (currentUser.getRole() == UserRole.SHOPKEEPER) {
			return ResponseEntity.ok(service.getShopsByOwnerId(currentUser.getId()));
		}

		return ResponseEntity.ok(service.getAllShops());
	}

	@PutMapping("/{id}")
	public ResponseEntity<ShopResponse> update(@PathVariable Long id, @RequestBody ShopRequest req,
			HttpServletRequest request) {

		Long currentUserId = (Long) request.getAttribute("currentUserId");
		ShopResponse shop = service.getShopById(id);
		if (currentUserId != shop.getOwnerUserId()) {
			throw new BadRequestException("You cannot access this page!");
		}

		checkAccess(shop.getOwnerUserId(), request);
		return ResponseEntity.ok(service.updateShop(id, req));
	}

	@DeleteMapping("/{shopId}")
	public ResponseEntity<?> deleteShop(@PathVariable Long shopId, HttpServletRequest request) {
		ShopResponse shop = service.getShopById(shopId);

		Long currentUserId = (Long) request.getAttribute("currentUserId");
		if (currentUserId != shop.getOwnerUserId()) {
			throw new BadRequestException("You cannot access this page!");
		}
		checkAccess(shop.getOwnerUserId(), request);
		return ResponseEntity.ok(service.softDeleteShop(shopId));
	}

	@GetMapping("/my")
	public ResponseEntity<List<ShopResponse>> getMyShops(HttpServletRequest request) {
		User currentUser = (User) request.getAttribute("currentUser");

		if (currentUser == null || currentUser.getRole() != UserRole.SHOPKEEPER) {
			throw new BadRequestException("Only shopkeepers can view their own shops");
		}

		Long userId = currentUser.getId();
		return ResponseEntity.ok(service.getShopsByOwnerId(userId));
	}

}