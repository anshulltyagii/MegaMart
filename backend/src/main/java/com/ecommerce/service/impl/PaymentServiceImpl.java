package com.ecommerce.service.impl;

import com.ecommerce.dto.PaymentRequest;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Order;
import com.ecommerce.model.Payment;
import com.ecommerce.dto.OrderItemResponse;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import com.ecommerce.service.InventoryService;
import com.ecommerce.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

	private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

	private static final boolean SIMULATION_ENABLED = false;
	private static final double SUCCESS_RATE = 0.5;

	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private final PaymentRepository paymentRepo;
	private final OrderRepository orderRepo;
	private final InventoryService inventoryService;

	public PaymentServiceImpl(PaymentRepository paymentRepo, OrderRepository orderRepo,
			InventoryService inventoryService) {
		this.paymentRepo = paymentRepo;
		this.orderRepo = orderRepo;
		this.inventoryService = inventoryService;

		log.info("---------------------------------------------------");
		log.info("PaymentService Initialized - WITH STOCK RELEASE FIX");
		log.info("Payment Failure -> Stock Auto-Released");
		log.info("---------------------------------------------------");
	}

	@Override
	@Transactional
	public Payment processPayment(PaymentRequest request) {
		String correlationId = generateCorrelationId();
		LocalDateTime startTime = LocalDateTime.now();
		String finalStatus = "UNKNOWN";

		logPaymentStart(correlationId, request, startTime);

		try {
			validateRequest(request, correlationId);
			Order order = validateAndGetOrder(request.getOrderId(), correlationId);
			validateAmount(request.getAmount(), order.getTotalAmount(), correlationId);

			Payment payment = createPaymentRecord(request, correlationId);

			boolean success = processPaymentGateway(correlationId);

			if (success) {
				finalStatus = "SUCCESS";

				log.info("[{}] TRANSACTION SUCCESSFUL", correlationId);

				if ("COD".equalsIgnoreCase(request.getMethod())) {
					orderRepo.updatePaymentStatus(order.getId(), "PENDING", "CONFIRMED");
					payment.setStatus("SUCCESS");
				} else {
					orderRepo.updatePaymentStatus(order.getId(), "PAID", "CONFIRMED");
					payment.setStatus("SUCCESS");
				}

				log.info("[{}] Consuming reserved inventory...", correlationId);
				consumeInventory(order.getId(), correlationId);

			} else {
				finalStatus = "FAILED";
				payment.setStatus("FAILED");

				log.warn("[{}] TRANSACTION FAILED - RELEASING STOCK", correlationId);

				orderRepo.updatePaymentStatus(order.getId(), "FAILED", "PLACED");

				releaseStockForFailedPayment(order.getId(), correlationId);
			}

			return paymentRepo.save(payment);

		} catch (Exception e) {
			finalStatus = "ERROR";
			log.error("[{}]  UNEXPECTED ERROR: {}", correlationId, e.getMessage());

			releaseStockForFailedPayment(request.getOrderId(), correlationId);

			throw new BadRequestException("Payment processing failed: " + e.getMessage());
		} finally {
			logPaymentEnd(correlationId, finalStatus, startTime);
		}
	}

	private void releaseStockForFailedPayment(Long orderId, String correlationId) {
		if (orderId == null)
			return;

		try {
			List<OrderItemResponse> items = orderRepo.findItemsByOrderId(orderId);
			for (OrderItemResponse item : items) {
				try {
					inventoryService.releaseReserved(item.getProductId(), item.getQuantity());
					log.info("[{}]    Released reservation for Product {}", correlationId, item.getProductId());
				} catch (Exception e) {
					log.error("[{}]   Failed to release stock for Product {}", correlationId, item.getProductId());
				}
			}
		} catch (Exception e) {
			log.error("[{}] Critical error releasing stock: {}", correlationId, e.getMessage());
		}
	}

	private void validateRequest(PaymentRequest request, String correlationId) {
		if (request == null || request.getOrderId() == null || request.getAmount() == null) {
			throw new BadRequestException("Payment request cannot be null");
		}
		if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
			throw new BadRequestException("Payment amount must be greater than zero");
		}
		if (request.getMethod() == null || request.getMethod().trim().isEmpty()) {
			throw new BadRequestException("Payment method is required");
		}
	}

	private Order validateAndGetOrder(Long orderId, String correlationId) {
		Order order = orderRepo.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found"));

		if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
			throw new BadRequestException("Order is already paid");
		}
		if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
			throw new BadRequestException("Cannot pay for a cancelled order");
		}
		return order;
	}

	private void validateAmount(BigDecimal reqAmount, BigDecimal orderAmount, String correlationId) {
		if (reqAmount.compareTo(orderAmount) != 0) {
			throw new BadRequestException("Amount mismatch! Expected: " + orderAmount + ", Got: " + reqAmount);
		}
	}

	private Payment createPaymentRecord(PaymentRequest request, String correlationId) {
		Payment payment = new Payment();
		payment.setOrderId(request.getOrderId());
		payment.setAmount(request.getAmount());
		payment.setMethod(request.getMethod().toUpperCase());

		String prefix = "COD".equalsIgnoreCase(request.getMethod()) ? "COD-" : "TXN-";
		String ref = request.getTxnReference() != null ? request.getTxnReference()
				: prefix + System.currentTimeMillis();

		payment.setTxnReference(ref);
		payment.setCreatedAt(LocalDateTime.now());
		return payment;
	}

	private boolean processPaymentGateway(String correlationId) {
		return !SIMULATION_ENABLED || SECURE_RANDOM.nextDouble() < SUCCESS_RATE;
	}

	private void consumeInventory(Long orderId, String correlationId) {
		try {
			List<OrderItemResponse> items = orderRepo.findItemsByOrderId(orderId);
			for (OrderItemResponse item : items) {
				try {
					inventoryService.consumeReservedOnOrder(item.getProductId(), item.getQuantity());
					log.info("[{}]    Consumed product {}", correlationId, item.getProductId());
				} catch (Exception e) {
					log.warn("[{}]    Failed to consume product {}: {}", correlationId, item.getProductId(),
							e.getMessage());
				}
			}
		} catch (Exception e) {
			log.warn("[{}] Inventory consumption error: {}", correlationId, e.getMessage());
		}
	}

	private String generateCorrelationId() {
		return "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
	}

	private void logPaymentStart(String id, PaymentRequest req, LocalDateTime start) {
		log.info("┌──────────────────────────────────────────────────────────┐");
		log.info("│ PAYMENT PROCESSING STARTED                                 │");
		log.info("│ ID: {} | Method: {} | Order: {} │", id, req.getMethod(), req.getOrderId());
		log.info("└──────────────────────────────────────────────────────────┘");
	}

	private void logPaymentEnd(String id, String status, LocalDateTime start) {
		log.info("Payment Process Ended [{}] Status: {}", id, status);
	}

	@Override
	public Payment getPaymentByOrderId(Long orderId) {
		return paymentRepo.findByOrderId(orderId).orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
	}
}
