package com.ecommerce.repository;

import com.ecommerce.dto.OrderItemResponse;
import com.ecommerce.model.Order;
import com.ecommerce.model.OrderItem;
import java.util.List;
import java.util.Optional;

public interface OrderRepository {
	Order save(Order order);

	void saveOrderItems(List<OrderItem> items);

	List<Order> findByUserId(Long userId);

	Optional<Order> findById(Long orderId);

	void updatePaymentStatus(Long orderId, String paymentStatus, String orderStatus);

	List<OrderItemResponse> findItemsByOrderId(Long orderId);

	void updateOrderStatus(Long orderId, String status);

	List<Order> findAll();
}