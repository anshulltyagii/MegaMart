package com.ecommerce.service.impl;

import com.ecommerce.dto.ShopStatsResponse;
import com.ecommerce.repository.ShopStatsRepository;
import com.ecommerce.service.ShopStatsService;
import org.springframework.stereotype.Service;

@Service
public class ShopStatsServiceImpl implements ShopStatsService {

	private final ShopStatsRepository repo;

	public ShopStatsServiceImpl(ShopStatsRepository repo) {
		this.repo = repo;
	}

	@Override
	public ShopStatsResponse getStats(Long shopId) {

		ShopStatsResponse res = new ShopStatsResponse();

		res.setTotalRevenue(repo.getTotalRevenue(shopId));
		res.setTotalOrders(repo.getTotalOrders(shopId));
		res.setTotalProducts(repo.getTotalProducts(shopId));
		res.setCustomers(repo.getCustomerCount(shopId));
		res.setTodayRevenue(repo.getTodayRevenue(shopId));
		res.setLast7Days(repo.getRevenueLast7Days(shopId));

		return res;
	}
}
