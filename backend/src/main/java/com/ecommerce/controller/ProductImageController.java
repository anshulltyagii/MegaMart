package com.ecommerce.controller;

import com.ecommerce.dto.ProductImageRequest;
import com.ecommerce.model.ProductImage;
import com.ecommerce.model.User;
import com.ecommerce.enums.UserRole;
import com.ecommerce.service.ProductImageService;
import com.ecommerce.service.ProductService;
import com.ecommerce.dto.ApiResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProductImageController {

	private final ProductImageService service;
	private final ProductService productService;

	public ProductImageController(ProductImageService service, ProductService productService) {
		this.service = service;
		this.productService = productService;
	}

	private boolean canAccess(Long productId, User currentUser) {
		return currentUser.getRole() == UserRole.ADMIN
				|| productService.productBelongsToUser(productId, currentUser.getId());
	}

	@PostMapping("/products/{productId}/images/upload")
	public ResponseEntity<ApiResponse<ProductImage>> upload(@PathVariable Long productId,
			@RequestParam("file") MultipartFile file, @RequestAttribute("currentUser") User currentUser) {

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse<>(false, "Not allowed", null));
		}

		ProductImage saved = service.uploadAndSave(productId, file);
		return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Image uploaded", saved));
	}

	@PostMapping("/products/{productId}/images")
	public ResponseEntity<ApiResponse<ProductImage>> addManually(@PathVariable Long productId,
			@RequestBody ProductImageRequest req, @RequestAttribute("currentUser") User currentUser) {

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse<>(false, "Not allowed", null));
		}

		ProductImage saved = service.addImageToProduct(productId, req);
		return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Image added", saved));
	}

	@GetMapping("/products/{productId}/images")
	public ResponseEntity<ApiResponse<List<ProductImage>>> getImages(@PathVariable Long productId) {
		return ResponseEntity.ok(new ApiResponse<>(true, "Fetched", service.getImagesByProduct(productId)));
	}

	@PutMapping("/product-images/{imageId}")
	public ResponseEntity<ApiResponse<ProductImage>> update(@PathVariable Long imageId,
			@RequestBody ProductImageRequest req, @RequestAttribute("currentUser") User currentUser) {

		Long productId = service.getProductIdByImageId(imageId);

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse<>(false, "Not allowed", null));
		}

		return ResponseEntity.ok(new ApiResponse<>(true, "Updated", service.updateImage(imageId, req)));
	}

	@DeleteMapping("/product-images/{imageId}")
	public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long imageId,
			@RequestAttribute("currentUser") User currentUser) {

		Long productId = service.getProductIdByImageId(imageId);

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse<>(false, "Not allowed", null));
		}

		service.softDeleteImage(imageId);
		return ResponseEntity.ok(new ApiResponse<>(true, "Soft deleted", null));
	}

	@PatchMapping("/product-images/{imageId}/primary")
	public ResponseEntity<ApiResponse<Void>> setPrimary(@PathVariable Long imageId, @RequestParam Long productId,
			@RequestAttribute("currentUser") User currentUser) {

		if (!canAccess(productId, currentUser)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse<>(false, "Not allowed", null));
		}

		service.setPrimaryImage(productId, imageId);
		return ResponseEntity.ok(new ApiResponse<>(true, "Primary set", null));
	}
}