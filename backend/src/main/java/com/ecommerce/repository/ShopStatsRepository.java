package com.ecommerce.repository;

import java.util.List;

public interface ShopStatsRepository {

	double getTotalRevenue(Long shopId);

	int getTotalOrders(Long shopId);

	int getTotalProducts(Long shopId);

	int getCustomerCount(Long shopId);

	double getTodayRevenue(Long shopId);

	List<Double> getRevenueLast7Days(Long shopId);
}