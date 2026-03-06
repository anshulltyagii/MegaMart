package com.ecommerce.controller;

import com.ecommerce.dto.WishlistRequest;
import com.ecommerce.dto.WishlistResponse;
import com.ecommerce.service.CartService;
import com.ecommerce.service.WishlistService;
import com.ecommerce.util.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

	@Autowired
	private WishlistService wishlistService;

	@Autowired
	private JwtUtil jwtUtil;

	@Autowired
	private CartService cartService;

	private void validateUser(Long userId, String token) {
		Long loggedId = jwtUtil.getUserId(token);

		if (!loggedId.equals(userId)) {
			throw new RuntimeException(" Unauthorized! You can access only your wishlist.");
		}
	}

	@PostMapping("/add")
	public ResponseEntity<WishlistResponse> add(@RequestHeader("Authorization") String token,
			@RequestBody WishlistRequest request) {
		validateUser(request.getUserId(), token.replace("Bearer ", ""));
		return ResponseEntity.ok(wishlistService.addToWishlist(request.getUserId(), request.getProductId()));
	}

	@DeleteMapping("/remove")
	public ResponseEntity<Boolean> remove(@RequestHeader("Authorization") String token,
			@RequestBody WishlistRequest request) {
		validateUser(request.getUserId(), token.replace("Bearer ", ""));
		return ResponseEntity.ok(wishlistService.removeFromWishlist(request.getUserId(), request.getProductId()));
	}

	@GetMapping("/{userId}")
	public ResponseEntity<List<WishlistResponse>> getWishlist(@RequestHeader("Authorization") String token,
			@PathVariable Long userId) {
		validateUser(userId, token.replace("Bearer ", ""));
		return ResponseEntity.ok(wishlistService.getUserWishlist(userId));
	}

	@PostMapping("/{userId}/{productId}/move-to-cart")
	public ResponseEntity<?> moveWishlistToCart(@RequestHeader("Authorization") String token, @PathVariable Long userId,
			@PathVariable Long productId, @RequestParam(defaultValue = "1") Integer qty) {
		validateUser(userId, token.replace("Bearer ", ""));

		var item = cartService.addToCart(userId, productId, qty);
		wishlistService.removeFromWishlist(userId, productId);

		return ResponseEntity.ok(item);
	}
}