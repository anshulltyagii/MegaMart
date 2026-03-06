
package com.ecommerce.service.impl;

import com.ecommerce.dto.CartResponse;
import com.ecommerce.dto.InventoryResponse;
import com.ecommerce.dto.OrderItemResponse;
import com.ecommerce.dto.OrderRequest;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.enums.DiscountType;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.CartItem;
import com.ecommerce.model.Coupon;
import com.ecommerce.model.Order;
import com.ecommerce.model.OrderItem;
import com.ecommerce.repository.CouponRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.service.CartService;
import com.ecommerce.service.InventoryService;
import com.ecommerce.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class OrderServiceImpl implements OrderService {

	private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

	private static final int MIN_ADDRESS_LENGTH = 10;
	private static final int MAX_ADDRESS_LENGTH = 500;
	private static final List<String> VALID_ORDER_STATUSES = List.of("PLACED", "CONFIRMED", "SHIPPED", "DELIVERED",
			"CANCELLED", "RETURNED");

	private final CartService cartService;
	private final OrderRepository orderRepository;
	private final CouponRepository couponRepository;
	private final InventoryService inventoryService;

	public OrderServiceImpl(CartService cartService, OrderRepository orderRepository, CouponRepository couponRepository,
			InventoryService inventoryService) {
		this.cartService = cartService;
		this.orderRepository = orderRepository;
		this.couponRepository = couponRepository;
		this.inventoryService = inventoryService;

		log.info("----------------------------------------------------------");
		log.info("OrderService Initialized - FINAL PRODUCTION VERSION");
		log.info("Fix applied: Cancellation logic based on Order Status (CONFIRMED vs PLACED)");
		log.info("----------------------------------------------------------");
	}

	@Override
	@Transactional
	public List<Order> placeOrder(Long userId, OrderRequest request) {
		log.info("-----------------------------");
		log.info("PLACING ORDER - User: {}", userId);
		log.info("-----------------------------");

		validateUserId(userId);
		validateOrderRequest(request);
		validateShippingAddress(request.getShippingAddress());

		CartResponse cartResponse = cartService.getUserCart(userId);
		Map<Long, List<CartItem>> itemsByShop = cartResponse.getItemsByShop();

		if (itemsByShop == null || itemsByShop.isEmpty()) {
			throw new BadRequestException("Cannot place order: Your cart is empty");
		}

		List<CartItem> allItems = new ArrayList<>();
		for (List<CartItem> shopItems : itemsByShop.values()) {
			allItems.addAll(shopItems);
		}
		checkInventoryAvailability(allItems);

		List<CartItem> reservedItems = new ArrayList<>();
		try {
			for (CartItem item : allItems) {
				inventoryService.reserveStock(item.getProductId(), item.getQuantity());
				reservedItems.add(item);
			}
		} catch (Exception e) {
			log.error("Inventory reservation failed: {}", e.getMessage());
			rollbackReservations(reservedItems);
			throw new BadRequestException("Failed to reserve inventory: " + e.getMessage());
		}

		Coupon coupon = null;
		if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
			coupon = validateAndGetCoupon(request.getCouponCode(), userId);
		}

		List<Order> createdOrders = new ArrayList<>();
		BigDecimal totalCartValue = BigDecimal.ZERO;
		BigDecimal totalCouponDiscount = BigDecimal.ZERO;
		BigDecimal platformSubsidy = BigDecimal.ZERO;
		BigDecimal shopDiscount = BigDecimal.ZERO;

		try {
			for (List<CartItem> shopItems : itemsByShop.values()) {
				totalCartValue = totalCartValue.add(calculateShopTotal(shopItems));
			}

			if (coupon != null) {
				totalCouponDiscount = calculateDiscountAmount(totalCartValue, coupon);
			}

			log.info("Cart Total: Rs{}", totalCartValue);
			if (coupon != null) {
				log.info("Coupon: {} (Type: {})", coupon.getCode(),
						coupon.getShopId() == null ? "GLOBAL" : "SHOP-SPECIFIC");
				log.info("Total Discount: Rs{}", totalCouponDiscount);
			}

			for (Map.Entry<Long, List<CartItem>> entry : itemsByShop.entrySet()) {
				Long currentShopId = entry.getKey();
				List<CartItem> shopItems = entry.getValue();

				BigDecimal shopTotal = calculateShopTotal(shopItems);
				BigDecimal finalOrderAmount = shopTotal;
				BigDecimal thisOrderDiscount = BigDecimal.ZERO;
				String discountType = "NONE";

				if (coupon != null) {
					if (coupon.getShopId() == null) {

						BigDecimal proportion = shopTotal.divide(totalCartValue, 10, RoundingMode.HALF_UP);
						thisOrderDiscount = totalCouponDiscount.multiply(proportion).setScale(2, RoundingMode.HALF_UP);
						finalOrderAmount = shopTotal.subtract(thisOrderDiscount);
						platformSubsidy = platformSubsidy.add(thisOrderDiscount);
						discountType = "GLOBAL_PROPORTIONAL";

						log.info("  → Shop {} order: Rs{} (was Rs{}, proportional discount: -Rs{})", currentShopId,
								finalOrderAmount, shopTotal, thisOrderDiscount);

					} else if (coupon.getShopId().equals(currentShopId)) {

						thisOrderDiscount = calculateDiscountAmount(shopTotal, coupon);
						finalOrderAmount = shopTotal.subtract(thisOrderDiscount);
						shopDiscount = shopDiscount.add(thisOrderDiscount);
						discountType = "SHOP_SPECIFIC";

						log.info("  → Shop {} order: Rs{} (was Rs{}, shop discount: -Rs{})", currentShopId,
								finalOrderAmount, shopTotal, thisOrderDiscount);

					} else {

						finalOrderAmount = shopTotal;
						discountType = "NONE_DIFFERENT_SHOP";
						log.info("  → Shop {} order: Rs{} (full price - coupon for Shop {})", currentShopId,
								finalOrderAmount, coupon.getShopId());
					}
				}

				if (finalOrderAmount.compareTo(BigDecimal.ZERO) < 0) {
					finalOrderAmount = BigDecimal.ZERO;
				}

				Order order = new Order();
				order.setUserId(userId);
				order.setShopId(currentShopId);
				order.setShippingAddress(request.getShippingAddress().trim());
				order.setTotalAmount(finalOrderAmount.setScale(2, RoundingMode.HALF_UP));
				order.setOrderNumber(generateOrderNumber(currentShopId));
				order.setStatus("PLACED");
				order.setPaymentStatus("PENDING");

				Order savedOrder = orderRepository.save(order);
				createdOrders.add(savedOrder);

				log.info("  Order {} created - Amount: Rs{} ({})", savedOrder.getOrderNumber(), finalOrderAmount,
						discountType);

				List<OrderItem> orderItems = createOrderItems(savedOrder.getId(), shopItems);
				orderRepository.saveOrderItems(orderItems);
			}

			if (coupon != null) {
				Long firstOrderId = createdOrders.get(0).getId();
				couponRepository.recordUsage(userId, coupon.getId(), firstOrderId);
			}

		} catch (Exception e) {
			log.error("Order creation failed: {}", e.getMessage());
			rollbackReservations(allItems);
			throw e;
		}

		cartService.clearCart(userId);

		log.info("--------------------------------------------------------------");
		log.info("ORDER PLACED SUCCESSFULLY - {} order(s) created", createdOrders.size());
		log.info("---------------------------------------------------------------");

		return createdOrders;
	}

	@Override
	@Transactional
	public void cancelOrder(Long orderId) {
		validateOrderId(orderId);
		Order o = orderRepository.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found"));

		if (List.of("SHIPPED", "DELIVERED", "RETURNED", "CANCELLED").contains(o.getStatus())) {
			throw new BadRequestException("Cannot cancel order in state: " + o.getStatus());
		}

		orderRepository.updateOrderStatus(orderId, "CANCELLED");

		List<OrderItemResponse> items = orderRepository.findItemsByOrderId(orderId);
		boolean stockWasConsumed = "CONFIRMED".equalsIgnoreCase(o.getStatus());

		for (OrderItemResponse item : items) {
			if (stockWasConsumed) {
				inventoryService.addStock(item.getProductId(), item.getQuantity());
			} else {
				inventoryService.releaseReserved(item.getProductId(), item.getQuantity());
			}
		}

		orderRepository.updatePaymentStatus(orderId, "FAILED", "CANCELLED");

		log.info("Order {} cancelled. Status: CANCELLED, Payment: FAILED, Restocked: {}", orderId, stockWasConsumed);
	}

	@Override
	public List<OrderResponse> getUserOrders(Long userId) {
		validateUserId(userId);
		List<Order> orders = orderRepository.findByUserId(userId);
		List<OrderResponse> res = new ArrayList<>();
		for (Order o : orders) {
			res.add(mapToResponse(o, orderRepository.findItemsByOrderId(o.getId())));
		}
		return res;
	}

	@Override
	public OrderResponse getOrderDetails(Long orderId) {
		validateOrderId(orderId);
		Order o = orderRepository.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
		return mapToResponse(o, orderRepository.findItemsByOrderId(orderId));
	}

	@Override
	public List<OrderResponse> getAllOrders() {
		return orderRepository.findAll().stream().map(o -> {
			List<OrderItemResponse> items = orderRepository.findItemsByOrderId(o.getId()).stream()
					.map(i -> new OrderItemResponse(i.getProductId(), i.getProductName(), i.getQuantity(),
							i.getUnitPrice(), i.getTotalPrice(), i.getProductImage()))
					.toList();
			return mapToResponse(o, items);

		}).toList();
	}

	@Override
	@Transactional
	public OrderResponse updateOrderStatus(Long orderId, String newStatus) {
		validateOrderId(orderId);
		validateStatus(newStatus);

		Order o = orderRepository.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found"));

		if ("DELIVERED".equals(o.getStatus()) || "CANCELLED".equals(o.getStatus())) {
			throw new BadRequestException("Cannot change status of a " + o.getStatus() + " order");
		}

		orderRepository.updateOrderStatus(orderId, newStatus);
		o.setStatus(newStatus);
		return mapToResponse(o, null);
	}

	private List<OrderItem> createOrderItems(Long orderId, List<CartItem> items) {
		List<OrderItem> list = new ArrayList<>();
		for (CartItem ci : items) {
			BigDecimal total = ci.getPriceAtAdd().multiply(new BigDecimal(ci.getQuantity()));
			list.add(new OrderItem(orderId, ci.getProductId(), ci.getQuantity(), ci.getPriceAtAdd(), total));
		}
		return list;
	}

	private void checkInventoryAvailability(List<CartItem> items) {
		List<String> errors = new ArrayList<>();
		for (CartItem item : items) {
			try {
				InventoryResponse inv = inventoryService.getInventory(item.getProductId());
				if (inv.getAvailable() < item.getQuantity()) {
					errors.add("Product " + item.getProductId() + ": Insufficient stock");
				}
			} catch (ResourceNotFoundException e) {
				errors.add("Product " + item.getProductId() + ": Not found");
			}
		}
		if (!errors.isEmpty()) {
			throw new BadRequestException("Cannot place order:\n" + String.join("\n", errors));
		}
	}

	private void rollbackReservations(List<CartItem> items) {
		for (CartItem item : items) {
			try {
				inventoryService.releaseReserved(item.getProductId(), item.getQuantity());
			} catch (Exception e) {
				log.error("Rollback failed for product {}", item.getProductId());
			}
		}
	}

	private Coupon validateAndGetCoupon(String code, Long userId) {
		Coupon c = couponRepository.findByCode(code.trim().toUpperCase())
				.orElseThrow(() -> new ResourceNotFoundException("Invalid Coupon Code"));

		if (c.getValidFrom() != null && c.getValidFrom().isAfter(LocalDate.now()))
			throw new BadRequestException("Coupon not yet active");
		if (c.getValidTo() != null && c.getValidTo().isBefore(LocalDate.now()))
			throw new BadRequestException("Coupon expired");
		if (couponRepository.isUsedByUser(userId, c.getId()))
			throw new BadRequestException("You have already used this coupon");

		return c;
	}

	private BigDecimal calculateShopTotal(List<CartItem> items) {
		return items.stream().map(i -> i.getPriceAtAdd().multiply(new BigDecimal(i.getQuantity())))
				.reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	private BigDecimal calculateDiscountAmount(BigDecimal total, Coupon coupon) {
		if (coupon.getDiscountType() == DiscountType.FLAT) {
			return coupon.getDiscountValue().min(total);
		} else {
			return total.multiply(coupon.getDiscountValue()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
		}
	}

	private String generateOrderNumber(Long shopId) {
		return "ORD-" + System.currentTimeMillis() + "-" + shopId;
	}

	private void validateUserId(Long id) {
		if (id == null || id <= 0)
			throw new BadRequestException("Invalid User ID");
	}

	private void validateOrderId(Long id) {
		if (id == null || id <= 0)
			throw new BadRequestException("Invalid Order ID");
	}

	private void validateOrderRequest(OrderRequest r) {
		if (r == null)
			throw new BadRequestException("Request body missing");
	}

	private void validateStatus(String s) {
		if (s == null || !VALID_ORDER_STATUSES.contains(s.toUpperCase()))
			throw new BadRequestException("Invalid status");
	}

	private void validateShippingAddress(String a) {
		if (a == null || a.length() < MIN_ADDRESS_LENGTH)
			throw new BadRequestException("Address too short");
		if (a.length() > MAX_ADDRESS_LENGTH)
			throw new BadRequestException("Address too long");
	}

	private OrderResponse mapToResponse(Order o, List<OrderItemResponse> items) {
		OrderResponse r = new OrderResponse();
		r.setOrderId(o.getId());
		r.setOrderNumber(o.getOrderNumber());
		r.setTotalAmount(o.getTotalAmount());
		r.setStatus(o.getStatus());
		r.setPaymentStatus(o.getPaymentStatus());
		r.setShippingAddress(o.getShippingAddress());
		r.setCreatedAt(o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
		r.setItems(items);
		return r;
	}
}
