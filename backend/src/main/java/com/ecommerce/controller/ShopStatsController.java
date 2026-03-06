package com.ecommerce.controller;

import com.ecommerce.dto.ApiResponse;
import com.ecommerce.dto.ShopStatsResponse;
import com.ecommerce.service.ShopStatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shops")
public class ShopStatsController {

	private final ShopStatsService service;

	public ShopStatsController(ShopStatsService service) {
		this.service = service;
	}

	@GetMapping("/{shopId}/stats")
	public ResponseEntity<ApiResponse<ShopStatsResponse>> getStats(@PathVariable Long shopId) {
		ShopStatsResponse stats = service.getStats(shopId);
		return ResponseEntity.ok(new ApiResponse<>(true, "Stats loaded", stats));
	}
}