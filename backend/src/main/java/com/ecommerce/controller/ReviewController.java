package com.ecommerce.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.dto.ReviewRequest;
import com.ecommerce.dto.ReviewResponse;
import com.ecommerce.enums.UserRole;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.model.User;
import com.ecommerce.service.ReviewService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

	@Autowired
	private ReviewService reviewService;

	private void checkUserRole(Long targetUserId, HttpServletRequest req) {

		User currentUser = (User) req.getAttribute("currentUser");
		if (currentUser == null) {
			throw new BadRequestException("Unauthorized request");
		}

		Long currentUserId = currentUser.getId();
		boolean isOwner = currentUserId.equals(targetUserId);
		boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

		if (!isOwner && !isAdmin) {
			throw new BadRequestException("Access denied: omly user and admin can perform this action!");

		}

	}

	@PostMapping("/{userId}")
	public ReviewResponse addReview(@PathVariable Long userId, @RequestBody ReviewRequest req,
			HttpServletRequest request) {

		checkUserRole(userId, request);
		return reviewService.addReview(userId, req);
	}

	@GetMapping("/{reviewId}")
	public List<ReviewResponse> getReviewById(@PathVariable Long reviewId) {
		return reviewService.getReviewById(reviewId);
	}

	@GetMapping("/newest/{productId}")
	public List<ReviewResponse> getNewestReviews(@PathVariable Long productId) {
		return reviewService.getNewestReviews(productId);
	}

	@GetMapping("/rating/high/{productId}")
	public List<ReviewResponse> getHighestRatedReviews(@PathVariable Long productId) {
		return reviewService.getHighestRatedReviews(productId);
	}

	@GetMapping("/rating/low/{productId}")
	public List<ReviewResponse> getLowestRatedReviews(@PathVariable Long productId) {
		return reviewService.getLowestRatedReviews(productId);
	}

	@GetMapping("/avg/{productId}")
	public double getAvgRating(@PathVariable Long productId) {
		return reviewService.getAverageRating(productId);
	}

	@DeleteMapping("/{reviewId}/user/{userId}")
	public String deleteReview(@PathVariable Long reviewId, @PathVariable Long userId, HttpServletRequest request) {

		checkUserRole(userId, request);
		reviewService.deleteReview(reviewId, userId);
		return "Review soft deleted";

	}

}