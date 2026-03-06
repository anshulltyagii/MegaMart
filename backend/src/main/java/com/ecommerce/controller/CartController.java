package com.ecommerce.controller;

import com.ecommerce.dto.ApiResponse;
import com.ecommerce.dto.CartRequest;
import com.ecommerce.dto.CartResponse;
import com.ecommerce.model.CartItem;
import com.ecommerce.service.CartService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

	private static final Logger log = LoggerFactory.getLogger(CartController.class);

	private final CartService cartService;

	public CartController(CartService cartService) {
		this.cartService = cartService;
	}

	@GetMapping
	public ResponseEntity<ApiResponse<CartResponse>> getUserCart(HttpServletRequest request) {

		Long userId = (Long) request.getAttribute("currentUserId");

		log.info("GET /api/cart - Fetching cart for user: {}", userId);

		CartResponse cartResponse = cartService.getUserCart(userId);

		return ResponseEntity.ok(new ApiResponse<>(true, "Cart retrieved successfully", cartResponse));
	}

	@PostMapping("/items")
	public ResponseEntity<ApiResponse<CartItem>> addItemToCart(@RequestBody CartRequest cartRequest,
			HttpServletRequest request) {

		Long userId = (Long) request.getAttribute("currentUserId");

		log.info("POST /api/cart/items - User: {} adding item: productId={}, quantity={}", userId,
				cartRequest.getProductId(), cartRequest.getQuantity());

		CartItem cartItem = cartService.addToCart(userId, cartRequest.getProductId(), cartRequest.getQuantity());

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new ApiResponse<>(true, "Item added to cart successfully", cartItem));
	}

	@PutMapping("/items/{itemId}")
	public ResponseEntity<ApiResponse<CartItem>> updateCartItemQuantity(@PathVariable Long itemId,
			@RequestBody CartRequest cartRequest, HttpServletRequest request) {

		// Extracting userId from JWT token
		Long userId = (Long) request.getAttribute("currentUserId");

		log.info("PUT /api/cart/items/{} - User: {} updating quantity to {}", itemId, userId,
				cartRequest.getQuantity());

		CartItem updatedItem = cartService.updateCartItemQuantity(userId, itemId, cartRequest.getQuantity());

		return ResponseEntity.ok(new ApiResponse<>(true, "Cart item updated successfully", updatedItem));
	}

	@DeleteMapping("/items/{itemId}")
	public ResponseEntity<ApiResponse<Void>> removeItemFromCart(@PathVariable Long itemId, HttpServletRequest request) {

		// Extracting userId from JWT token
		Long userId = (Long) request.getAttribute("currentUserId");

		log.info("DELETE /api/cart/items/{} - User: {} removing item", itemId, userId);

		cartService.removeFromCart(userId, itemId);

		return ResponseEntity.ok(new ApiResponse<>(true, "Item removed from cart successfully"));
	}

	@DeleteMapping
	public ResponseEntity<ApiResponse<Void>> clearCart(HttpServletRequest request) {

		Long userId = (Long) request.getAttribute("currentUserId");

		log.info("DELETE /api/cart - User: {} clearing cart", userId);

		cartService.clearCart(userId);

		return ResponseEntity.ok(new ApiResponse<>(true, "Cart cleared successfully"));
	}

	@GetMapping("/validate")
	public ResponseEntity<ApiResponse<CartResponse>> validateCart(HttpServletRequest request) {

		Long userId = (Long) request.getAttribute("currentUserId");

		log.info("GET /api/cart/validate - User: {} validating cart", userId);

		CartResponse cartResponse = cartService.validateCart(userId);

		return ResponseEntity.ok(new ApiResponse<>(true, "Cart is valid for checkout", cartResponse));
	}
}