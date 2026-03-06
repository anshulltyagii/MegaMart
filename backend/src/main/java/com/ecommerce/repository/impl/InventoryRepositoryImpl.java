package com.ecommerce.repository.impl;

import com.ecommerce.model.Inventory;
import com.ecommerce.repository.InventoryRepository;
import com.ecommerce.repository.rowmapper.InventoryRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class InventoryRepositoryImpl implements InventoryRepository {

	private final JdbcTemplate jdbcTemplate;

	public InventoryRepositoryImpl(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public Optional<Inventory> findByProductId(Long productId) {
		String sql = "SELECT * FROM inventory WHERE product_id = ?";

		List<Inventory> list = jdbcTemplate.query(sql, new InventoryRowMapper(), productId);
		return list.stream().findFirst();
	}

	@Override
	public boolean createInventory(Long productId, int initialQuantity) {
		String sql = """
				INSERT INTO inventory (product_id, quantity, reserved)
				VALUES (?, ?, 0)
				""";

		return jdbcTemplate.update(sql, productId, initialQuantity) > 0;
	}

	@Override
	public boolean update(Inventory inventory) {
		String sql = """
				UPDATE inventory
				SET quantity = ?, reserved = ?
				WHERE product_id = ?
				""";

		return jdbcTemplate.update(sql, inventory.getQuantity(), inventory.getReserved(), inventory.getProductId()) > 0;
	}

	@Override
	public boolean increaseStock(Long productId, int quantity) {
		String sql = """
				UPDATE inventory
				SET quantity = quantity + ?
				WHERE product_id = ?
				""";

		return jdbcTemplate.update(sql, quantity, productId) > 0;
	}

	@Override
	public boolean decreaseStock(Long productId, int quantity) {
		String sql = """
				UPDATE inventory
				SET quantity = quantity - ?
				WHERE product_id = ?
				AND quantity >= ?
				""";

		return jdbcTemplate.update(sql, quantity, productId, quantity) > 0;
	}

	@Override
	public boolean reserveStock(Long productId, int quantity) {
		String sql = """
				UPDATE inventory
				SET reserved = reserved + ?
				WHERE product_id = ?
				AND (quantity - reserved) >= ?
				""";

		return jdbcTemplate.update(sql, quantity, productId, quantity) > 0;
	}

	@Override
	public boolean releaseReservedStock(Long productId, int quantity) {
		String sql = """
				UPDATE inventory
				SET reserved = reserved - ?
				WHERE product_id = ?
				AND reserved >= ?
				""";

		return jdbcTemplate.update(sql, quantity, productId, quantity) > 0;
	}

	@Override
	public boolean consumeReservedOnOrder(Long productId, int quantity) {
		String sql = """
				UPDATE inventory
				SET
				quantity = quantity - ?,
				reserved = reserved - ?
				WHERE product_id = ?
				AND reserved >= ?
				AND quantity >= ?
				""";

		return jdbcTemplate.update(sql, quantity, quantity, productId, quantity, quantity) > 0;
	}
}