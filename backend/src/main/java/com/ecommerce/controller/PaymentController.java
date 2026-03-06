package com.ecommerce.controller;

import com.ecommerce.dto.PaymentRequest;
import com.ecommerce.model.Payment;
import com.ecommerce.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

	private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

	private final PaymentService paymentService;

	public PaymentController(PaymentService paymentService) {
		this.paymentService = paymentService;
	}

	@PostMapping
	public ResponseEntity<Payment> makePayment(@RequestBody PaymentRequest request, HttpServletRequest httpRequest) {

		Long userId = (Long) httpRequest.getAttribute("currentUserId");

		log.info("POST /api/payments - User: {} processing payment for order: {}", userId, request.getOrderId());

		Payment payment = paymentService.processPayment(request);

		log.info("User: {} - Payment {} for order: {}", userId, payment.getStatus(), request.getOrderId());

		return ResponseEntity.ok(payment);
	}

	@GetMapping("/order/{orderId}")
	public ResponseEntity<Payment> getPaymentByOrderId(@PathVariable Long orderId, HttpServletRequest request) {

		// Extract userId from JWT token
		Long userId = (Long) request.getAttribute("currentUserId");

		log.info("GET /api/payments/order/{} - User: {} fetching payment", orderId, userId);

		Payment payment = paymentService.getPaymentByOrderId(orderId);

		return ResponseEntity.ok(payment);
	}
}