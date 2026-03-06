package com.ecommerce.service;

import com.ecommerce.dto.RecentlyViewedResponse;

import java.util.List;

public interface RecentlyViewedService {

	void addViewedProduct(Long userId, Long productId);

	List<RecentlyViewedResponse> getRecentlyViewed(Long userId, int limit);

	boolean clearRecentlyViewed(Long userId);
}