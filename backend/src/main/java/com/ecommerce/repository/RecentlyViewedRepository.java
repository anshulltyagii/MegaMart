package com.ecommerce.repository;

import com.ecommerce.model.RecentlyViewed;

import java.util.List;

public interface RecentlyViewedRepository {

	void saveOrUpdate(Long userId, Long productId);

	List<RecentlyViewed> findLastNByUser(Long userId, int limit);

	boolean deleteAllByUser(Long userId);
}