package com.ecommerce.controller;

import com.ecommerce.dto.ApiResponse;
import com.ecommerce.dto.ReturnRequestDTO;
import com.ecommerce.enums.UserRole; // ← Import your UserRole enum
import com.ecommerce.exception.UnauthorizedException;
import com.ecommerce.model.ReturnRequest;
import com.ecommerce.model.User;
import com.ecommerce.service.ReturnService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class ReturnController {

	private static final Logger log = LoggerFactory.getLogger(ReturnController.class);
	private final ReturnService returnService;

	public ReturnController(ReturnService returnService) {
		this.returnService = returnService;
	}

	@PostMapping
	public ResponseEntity<ApiResponse<Void>> requestReturn(@RequestBody ReturnRequestDTO request,
			HttpServletRequest httpRequest) {

		Long userId = (Long) httpRequest.getAttribute("currentUserId");
		log.info("POST /api/returns - User: {} requesting return for order: {}", userId, request.getOrderId());

		returnService.requestReturn(userId, request);

		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new ApiResponse<>(true, "Return request submitted successfully."));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<ReturnRequest>>> getUserReturns(HttpServletRequest request) {
		Long userId = (Long) request.getAttribute("currentUserId");
		log.info("GET /api/returns - User: {} fetching their returns", userId);

		List<ReturnRequest> requests = returnService.getUserReturnRequests(userId);

		String message = requests.isEmpty() ? "No requests found" : "Found " + requests.size();
		return ResponseEntity.ok(new ApiResponse<>(true, message, requests));
	}

	@GetMapping("/order/{orderId}")
	public ResponseEntity<ApiResponse<ReturnRequest>> getReturnStatus(@PathVariable Long orderId,
			HttpServletRequest request) {

		Long userId = (Long) request.getAttribute("currentUserId");
		log.info("GET /api/returns/order/{} - User: {} checking status", orderId, userId);

		ReturnRequest returnRequest = returnService.getReturnByOrderId(userId, orderId);

		return ResponseEntity.ok(new ApiResponse<>(true, "Found", returnRequest));
	}

	@PatchMapping("/{returnId}/approve")
	public ResponseEntity<ApiResponse<String>> approveReturn(@PathVariable Long returnId, HttpServletRequest request) {

		User currentUser = (User) request.getAttribute("currentUser");

		if (currentUser == null) {
			throw new UnauthorizedException("Authentication required");
		}

		UserRole role = currentUser.getRole();

		if (role == null || (role != UserRole.ADMIN && role != UserRole.SHOPKEEPER)) {
			log.warn("Unauthorized approval attempt - User: {}, Role: {}", currentUser.getId(), role);
			throw new UnauthorizedException("Only admins and shopkeepers can approve returns");
		}

		log.info("ADMIN (ID: {}, Role: {}) approving return ID: {}", currentUser.getId(), role, returnId);
		returnService.approveReturn(returnId);

		return ResponseEntity.ok(
				new ApiResponse<>(true, "Return approved successfully. Customer refunded and inventory restocked."));
	}

	@PatchMapping("/{returnId}/reject")
	public ResponseEntity<ApiResponse<String>> rejectReturn(@PathVariable Long returnId, HttpServletRequest request) {

		User currentUser = (User) request.getAttribute("currentUser");

		if (currentUser == null) {
			throw new UnauthorizedException("Authentication required");
		}

		UserRole role = currentUser.getRole();

		if (role == null || (role != UserRole.ADMIN && role != UserRole.SHOPKEEPER)) {
			log.warn("Unauthorized rejection attempt - User: {}, Role: {}", currentUser.getId(), role);
			throw new UnauthorizedException("Only admins and shopkeepers can reject returns");
		}

		log.info("ADMIN (ID: {}, Role: {}) rejecting return ID: {}", currentUser.getId(), role, returnId);
		returnService.rejectReturn(returnId);

		return ResponseEntity.ok(new ApiResponse<>(true, "Return request rejected."));
	}
}