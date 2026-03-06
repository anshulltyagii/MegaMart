package com.ecommerce.controller;

import com.ecommerce.dto.ProductRequest;
import com.ecommerce.dto.ProductResponse;
import com.ecommerce.enums.UserRole;
import com.ecommerce.model.User;
import com.ecommerce.service.ProductService;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
public class ProductController {

	private final ProductService productService;

	public ProductController(ProductService productService) {
		this.productService = productService;
	}

	private User getAuthenticatedUser(HttpServletRequest req) {
		User user = (User) req.getAttribute("currentUser");
		if (user == null) {
			throw new RuntimeException("User not found in request context (Auth Interceptor missed?)");
		}
		return user;
	}

	@PostMapping("/manage")
	public ResponseEntity<?> createProduct(@RequestBody ProductRequest request, HttpServletRequest req) {

		User user = getAuthenticatedUser(req);

		if (user.getRole() != UserRole.SHOPKEEPER && user.getRole() != UserRole.ADMIN) {
			return ResponseEntity.status(403).body("Only shopkeepers or admin can create products.");
		}

		if (user.getRole() == UserRole.SHOPKEEPER
				&& !productService.shopBelongsToUser(request.getShopId(), user.getId())) {
			return ResponseEntity.status(403).body("You cannot add products to a shop you do not own.");
		}

		ProductResponse resp = productService.createProduct(request);
		return new ResponseEntity<>(resp, HttpStatus.CREATED);
	}

	@PutMapping("/manage/{id}")
	public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody ProductRequest request,
			HttpServletRequest req) {

		User user = getAuthenticatedUser(req);

		boolean isOwner = productService.productBelongsToUser(id, user.getId());
		boolean isAdmin = user.getRole() == UserRole.ADMIN;

		if (!isOwner && !isAdmin) {
			return ResponseEntity.status(403).body("You can update only your own shop's products.");
		}

		ProductResponse resp = productService.updateProduct(id, request);
		return ResponseEntity.ok(resp);
	}

	@GetMapping("/{id}")
	public ResponseEntity<ProductResponse> getProduct(@PathVariable Long id) {
		Optional<ProductResponse> opt = productService.getProductById(id);
		return opt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
	}

	@GetMapping
	public ResponseEntity<List<ProductResponse>> listActive(@RequestParam(required = false) Long categoryId,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
		List<ProductResponse> list = productService.searchProducts(null, categoryId, page, size);
		return ResponseEntity.ok(list);
	}

	@GetMapping("/shop/{shopId}")
	public ResponseEntity<?> getByShop(@PathVariable Long shopId, HttpServletRequest req) {

		User user = (User) req.getAttribute("currentUser");

		List<ProductResponse> list = productService.getProductsByShop(shopId);
		return ResponseEntity.ok(list);
	}

	@DeleteMapping("/manage/{id}")
	public ResponseEntity<?> softDelete(@PathVariable Long id, HttpServletRequest req) {

		User user = getAuthenticatedUser(req);
		boolean isOwner = productService.productBelongsToUser(id, user.getId());
		boolean isAdmin = user.getRole() == UserRole.ADMIN;

		if (!isOwner && !isAdmin) {
			return ResponseEntity.status(403).body("You can delete only your own shop's products.");
		}

		boolean ok = productService.softDeleteProduct(id);

		if (!ok) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Unable to delete product");
		}

		return ResponseEntity.ok("Product marked inactive (soft-deleted)");
	}

	@GetMapping("/search")
	public ResponseEntity<List<ProductResponse>> search(@RequestParam(required = false) String q,
			@RequestParam(required = false) Long categoryId, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {

		List<ProductResponse> list = productService.searchProducts(q, categoryId, page, size);
		return ResponseEntity.ok(list);
	}

	@GetMapping("/search/suggest")
	public ResponseEntity<List<String>> searchSuggestions(@RequestParam String q) {

		List<String> suggestions = productService.searchSuggestions(q);
		return ResponseEntity.ok(suggestions);
	}
}