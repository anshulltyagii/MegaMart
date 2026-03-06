package com.ecommerce.controller;

import com.ecommerce.dto.ApiResponse;
import com.ecommerce.enums.UserRole;
import com.ecommerce.model.Category;
import com.ecommerce.model.User;
import com.ecommerce.service.CategoryService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

	private final CategoryService service;

	public CategoryController(CategoryService service) {
		this.service = service;
	}

	private ResponseEntity<ApiResponse<?>> checkAdmin(HttpServletRequest req) {

		User currentUser = (User) req.getAttribute("currentUser");

		if (currentUser == null) {
			return ResponseEntity.status(401).body(new ApiResponse<>(false, "Unauthorized", null));
		}

		if (currentUser.getRole() != UserRole.ADMIN) {
			return ResponseEntity.status(403)
					.body(new ApiResponse<>(false, "Only admin can perform this action", null));
		}

		return null;
	}

	@PostMapping
	public ResponseEntity<ApiResponse<Category>> create(@RequestBody Category c, HttpServletRequest req) {

		ResponseEntity<ApiResponse<?>> deny = checkAdmin(req);
		if (deny != null)
			return (ResponseEntity) deny;

		return ResponseEntity.ok(new ApiResponse<>(true, "Created", service.create(c)));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<?>> listActive() {
		return ResponseEntity.ok(new ApiResponse<>(true, "OK", service.listActive()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<Category>> getById(@PathVariable Long id) {
		Category c = service.getById(id);
		return ResponseEntity.ok(new ApiResponse<>(true, "OK", c));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteSoft(@PathVariable Long id, HttpServletRequest req) {

		ResponseEntity<ApiResponse<?>> deny = checkAdmin(req);
		if (deny != null)
			return (ResponseEntity) deny;

		service.deleteSoft(id);
		return ResponseEntity.ok(new ApiResponse<>(true, "Category deactivated", null));
	}

	@PutMapping("/{id}/activate")
	public ResponseEntity<ApiResponse<Void>> activate(@PathVariable Long id, HttpServletRequest req) {

		ResponseEntity<ApiResponse<?>> deny = checkAdmin(req);
		if (deny != null)
			return (ResponseEntity) deny;

		service.activate(id);
		return ResponseEntity.ok(new ApiResponse<>(true, "Category activated", null));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> update(@PathVariable Long id, @RequestBody Category c,
			HttpServletRequest req) {

		ResponseEntity<ApiResponse<?>> deny = checkAdmin(req);
		if (deny != null)
			return (ResponseEntity) deny;

		c.setId(id);
		service.update(c);

		return ResponseEntity.ok(new ApiResponse<>(true, "Category updated", null));
	}
}
