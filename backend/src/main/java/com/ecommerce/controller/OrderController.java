package com.ecommerce.controller;

import com.ecommerce.dto.OrderRequest;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.model.Order;
import com.ecommerce.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

	private static final Logger log = LoggerFactory.getLogger(OrderController.class);

	private final OrderService orderService;

	public OrderController(OrderService orderService) {
		this.orderService = orderService;
	}

	@PostMapping("/checkout")
	public ResponseEntity<List<Order>> checkout(@RequestBody OrderRequest request, HttpServletRequest httpRequest) {

		// Extract userId from JWT token
		Long userId = (Long) httpRequest.getAttribute("currentUserId");

		log.info("POST /api/orders/checkout - User: {} placing order", userId);

		List<Order> orders = orderService.placeOrder(userId, request);

		log.info("User: {} - Created {} order(s)", userId, orders.size());

		return ResponseEntity.ok(orders);
	}

	@GetMapping
	public ResponseEntity<List<OrderResponse>> getUserOrders(HttpServletRequest request) {
		// Extract userId from JWT token
		Long userId = (Long) request.getAttribute("currentUserId");

		log.info("GET /api/orders - Fetching orders for user: {}", userId);

		List<OrderResponse> orders = orderService.getUserOrders(userId);

		return ResponseEntity.ok(orders);
	}

	@GetMapping("/{orderId}")
	public ResponseEntity<OrderResponse> getOrderDetails(@PathVariable Long orderId, HttpServletRequest request) {

		// Extract userId from JWT token
		Long userId = (Long) request.getAttribute("currentUserId");

		log.info("GET /api/orders/{} - User: {} fetching order details", orderId, userId);

		OrderResponse order = orderService.getOrderDetails(orderId);

		return ResponseEntity.ok(order);
	}

	@PutMapping("/{orderId}/cancel")
	public ResponseEntity<String> cancelOrder(@PathVariable Long orderId, HttpServletRequest request) {

		Long userId = (Long) request.getAttribute("currentUserId");

		log.info("PUT /api/orders/{}/cancel - User: {} cancelling order", orderId, userId);

		orderService.cancelOrder(orderId);

		return ResponseEntity.ok("Order cancelled successfully. Inventory has been released.");
	}

	@GetMapping("/admin/all")
	public ResponseEntity<List<OrderResponse>> getAllOrders(HttpServletRequest request) {

		log.info("GET /api/orders/admin/all - Fetching all orders");

		List<OrderResponse> orders = orderService.getAllOrders();

		return ResponseEntity.ok(orders);
	}

	@PatchMapping("/admin/{orderId}/status")
	public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long orderId, @RequestParam String status,
			HttpServletRequest request) {

		log.info("PATCH /api/orders/admin/{}/status - Updating to: {}", orderId, status);

		OrderResponse updatedOrder = orderService.updateOrderStatus(orderId, status);

		return ResponseEntity.ok(updatedOrder);
	}
}