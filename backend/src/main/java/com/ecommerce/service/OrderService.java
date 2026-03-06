package com.ecommerce.service;

import com.ecommerce.dto.OrderRequest;
import com.ecommerce.dto.OrderResponse; // Import this!
import com.ecommerce.model.Order;
import java.util.List;

public interface OrderService {

	List<Order> placeOrder(Long userId, OrderRequest request);

	List<OrderResponse> getUserOrders(Long userId);

	OrderResponse getOrderDetails(Long orderId);

	void cancelOrder(Long orderId);

	List<OrderResponse> getAllOrders();

	OrderResponse updateOrderStatus(Long orderId, String newStatus);
}