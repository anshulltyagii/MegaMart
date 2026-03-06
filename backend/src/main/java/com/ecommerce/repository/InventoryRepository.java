package com.ecommerce.repository;

import com.ecommerce.model.Inventory;

import java.util.Optional;

public interface InventoryRepository {

	Optional<Inventory> findByProductId(Long productId);

	boolean createInventory(Long productId, int initialQuantity);

	boolean update(Inventory inventory);

	boolean increaseStock(Long productId, int quantity);

	boolean decreaseStock(Long productId, int quantity);

	boolean reserveStock(Long productId, int quantity);

	boolean releaseReservedStock(Long productId, int quantity);

	boolean consumeReservedOnOrder(Long productId, int quantity);
}