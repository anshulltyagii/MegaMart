package com.ecommerce.controller;

import com.ecommerce.dto.*;
import com.ecommerce.enums.UserRole;
import com.ecommerce.model.User;
import com.ecommerce.service.ProductVariantService;
import com.ecommerce.service.ProductService;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/variants")
public class ProductVariantController {

	private final ProductVariantService variantService;
	private final ProductService productService;

	public ProductVariantController(ProductVariantService variantService, ProductService productService) {
		this.variantService = variantService;
		this.productService = productService;
	}

	private boolean canAccess(Long productId, User currentUser) {
		return currentUser.getRole() == UserRole.ADMIN
				|| productService.productBelongsToUser(productId, currentUser.getId());
	}

	// GROUPS
	@PostMapping("/groups")
	public ResponseEntity<?> createGroup(@PathVariable Long productId, @RequestBody ProductVariantGroupRequest request,
			@RequestAttribute("currentUser") User currentUser) {

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(403).body(new ApiResponse<>(false, "Not allowed", null));
		}

		return new ResponseEntity<>(variantService.createGroup(productId, request), HttpStatus.CREATED);
	}

	@GetMapping("/groups")
	public ResponseEntity<List<ProductVariantGroupResponse>> getGroups(@PathVariable Long productId) {

		return ResponseEntity.ok(variantService.getGroupsByProduct(productId));
	}

	@PutMapping("/groups/{groupId}")
	public ResponseEntity<?> updateGroup(@PathVariable Long productId, @PathVariable Long groupId,
			@RequestBody ProductVariantGroupRequest request, @RequestAttribute("currentUser") User currentUser) {

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(403).body(new ApiResponse<>(false, "Not allowed", null));
		}

		return ResponseEntity.ok(variantService.updateGroup(groupId, request));
	}

	@DeleteMapping("/groups/{groupId}")
	public ResponseEntity<?> deleteGroup(@PathVariable Long productId, @PathVariable Long groupId,
			@RequestAttribute("currentUser") User currentUser) {

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(403).body(new ApiResponse<>(false, "Not allowed", null));
		}

		variantService.deleteGroup(groupId);
		return ResponseEntity.ok("Variant group deleted");
	}

	// VALUES

	@PostMapping("/groups/{groupId}/values")
	public ResponseEntity<?> createValue(@PathVariable Long productId, @PathVariable Long groupId,
			@RequestBody ProductVariantValueRequest request, @RequestAttribute("currentUser") User currentUser) {

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(403).body(new ApiResponse<>(false, "Not allowed", null));
		}

		return new ResponseEntity<>(variantService.createValue(groupId, request), HttpStatus.CREATED);
	}

	@GetMapping("/groups/{groupId}/values")
	public ResponseEntity<List<ProductVariantValueResponse>> getValues(@PathVariable Long groupId) {

		return ResponseEntity.ok(variantService.getValuesByGroup(groupId));
	}

	@PutMapping("/values/{valueId}")
	public ResponseEntity<?> updateValue(@PathVariable Long productId, @PathVariable Long valueId,
			@RequestBody ProductVariantValueRequest request, @RequestAttribute("currentUser") User currentUser) {

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(403).body(new ApiResponse<>(false, "Not allowed", null));
		}

		return ResponseEntity.ok(variantService.updateValue(valueId, request));
	}

	@DeleteMapping("/values/{valueId}")
	public ResponseEntity<?> deleteValue(@PathVariable Long productId, @PathVariable Long valueId,
			@RequestAttribute("currentUser") User currentUser) {

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(403).body(new ApiResponse<>(false, "Not allowed", null));
		}

		variantService.deleteValue(valueId);
		return ResponseEntity.ok("Variant value deleted");
	}

	// STOCK

	@PostMapping("/values/{valueId}/stock")
	public ResponseEntity<?> upsertStock(@PathVariable Long productId, @PathVariable Long valueId,
			@RequestBody ProductVariantStockRequest request, @RequestAttribute("currentUser") User currentUser) {

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(403).body(new ApiResponse<>(false, "Not allowed", null));
		}

		return ResponseEntity.ok(variantService.upsertStock(productId, valueId, request));
	}

	@GetMapping("/stock")
	public ResponseEntity<List<ProductVariantStockResponse>> getStock(@PathVariable Long productId) {

		return ResponseEntity.ok(variantService.getStockByProduct(productId));
	}
}