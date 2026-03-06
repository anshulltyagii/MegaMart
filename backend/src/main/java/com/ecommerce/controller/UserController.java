package com.ecommerce.controller;

import com.ecommerce.dto.UserRequest;
import com.ecommerce.dto.UserResponse;
import com.ecommerce.enums.UserRole;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.model.User;
import com.ecommerce.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	private void checkAccess(Long targetUserId, HttpServletRequest req) {

		User currentUser = (User) req.getAttribute("currentUser");
		Long currentUserId = currentUser.getId();

		boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
		boolean isOwner = currentUserId.equals(targetUserId);

		if (!isAdmin && !isOwner) {
			throw new BadRequestException("Access Denied: You cannot modify/view another user's data.");
		}
	}

	@PostMapping
	public ResponseEntity<UserResponse> createUser(@RequestBody UserRequest request, HttpServletRequest req) {

		User currentUser = (User) req.getAttribute("currentUser");

		if (currentUser.getRole() != UserRole.ADMIN) {
			throw new BadRequestException("Only ADMIN can create new users!");
		}

		UserResponse response = userService.createUser(request);
		return new ResponseEntity<>(response, HttpStatus.CREATED);
	}

	@PutMapping("/{id}")
	public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UserRequest request,
			HttpServletRequest req) {

		checkAccess(id, req);

		UserResponse response = userService.updateUser(id, request);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/{id}")
	public ResponseEntity<UserResponse> getUserById(@PathVariable Long id, HttpServletRequest req) {

		checkAccess(id, req);

		UserResponse response = userService.getUserById(id);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/active")
	public ResponseEntity<List<UserResponse>> getAllActiveUsers() {

		List<UserResponse> list = userService.getAllActiveUsers();
		return ResponseEntity.ok(list);
	}

	@GetMapping
	public ResponseEntity<List<UserResponse>> getAllUsers(HttpServletRequest req) {

		User currentUser = (User) req.getAttribute("currentUser");

		if (currentUser.getRole() != UserRole.ADMIN) {
			throw new BadRequestException("Only ADMIN can view all users!");
		}

		List<UserResponse> list = userService.getAllUsers();
		return ResponseEntity.ok(list);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<String> softDeleteUser(@PathVariable Long id, HttpServletRequest req) {

		checkAccess(id, req);

		boolean deleted = userService.softDeleteUser(id);

		if (!deleted) {
			throw new BadRequestException("Unable to delete user!");
		}

		return ResponseEntity.ok("User deleted successfully (status = SUSPENDED)");
	}

	@PatchMapping("/{id}/status")
	public ResponseEntity<String> updateAccountStatus(@PathVariable Long id, @RequestParam String status,
			HttpServletRequest req) {

		User currentUser = (User) req.getAttribute("currentUser");

		if (currentUser.getRole() != UserRole.ADMIN) {
			throw new BadRequestException("Only ADMIN can update user status!");
		}

		boolean updated = userService.updateAccountStatus(id, status.toUpperCase());

		if (!updated) {
			throw new BadRequestException("Failed to update user status");
		}

		return ResponseEntity.ok("Account status updated successfully");
	}

	@GetMapping("/check")
	public ResponseEntity<String> checkAvailability(@RequestParam(required = false) String username,
			@RequestParam(required = false) String email, @RequestParam(required = false) String phone) {

		if (username != null && userService.existsByUsername(username)) {
			return ResponseEntity.ok("USERNAME_TAKEN");
		}

		if (email != null && userService.existsByEmail(email)) {
			return ResponseEntity.ok("EMAIL_TAKEN");
		}

		if (phone != null && userService.existsByPhone(phone)) {
			return ResponseEntity.ok("PHONE_TAKEN");
		}

		return ResponseEntity.ok("AVAILABLE");
	}

}
