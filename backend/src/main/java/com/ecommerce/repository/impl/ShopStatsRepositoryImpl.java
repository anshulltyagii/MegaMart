package com.ecommerce.repository.impl;

import com.ecommerce.repository.ShopStatsRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ShopStatsRepositoryImpl implements ShopStatsRepository {

	private final JdbcTemplate jdbc;

	public ShopStatsRepositoryImpl(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public double getTotalRevenue(Long shopId) {
		String sql = """
				    SELECT COALESCE(SUM(total_amount), 0)
				    FROM orders
				    WHERE shop_id=? AND payment_status='PAID'
				""";
		return jdbc.queryForObject(sql, Double.class, shopId);
	}

	@Override
	public int getTotalOrders(Long shopId) {
		String sql = """
				    SELECT COUNT(*) FROM orders WHERE shop_id=?;
				""";
		return jdbc.queryForObject(sql, Integer.class, shopId);
	}

	@Override
	public int getTotalProducts(Long shopId) {
		String sql = "SELECT COUNT(*) FROM products WHERE shop_id=? AND is_active=TRUE";
		return jdbc.queryForObject(sql, Integer.class, shopId);
	}

	@Override
	public int getCustomerCount(Long shopId) {
		String sql = """
				    SELECT COUNT(DISTINCT user_id)
				    FROM orders
				    WHERE shop_id=?
				""";
		return jdbc.queryForObject(sql, Integer.class, shopId);
	}

	@Override
	public double getTodayRevenue(Long shopId) {
		String sql = """
				    SELECT COALESCE(SUM(total_amount), 0)
				    FROM orders
				    WHERE shop_id=?
				    AND payment_status='PAID'
				    AND DATE(created_at) = CURDATE()
				""";
		return jdbc.queryForObject(sql, Double.class, shopId);
	}

	@Override
	public List<Double> getRevenueLast7Days(Long shopId) {
		String sql = """
				    SELECT COALESCE(SUM(total_amount),0)
				    FROM orders
				    WHERE shop_id=? AND payment_status='PAID'
				    AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
				    GROUP BY DATE(created_at)
				    ORDER BY DATE(created_at)
				""";

		return jdbc.query(sql, (rs, rowNum) -> rs.getDouble(1), shopId);
	}
}