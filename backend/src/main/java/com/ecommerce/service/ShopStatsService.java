package com.ecommerce.service;

import com.ecommerce.dto.ShopStatsResponse;

public interface ShopStatsService {
	ShopStatsResponse getStats(Long shopId);
}