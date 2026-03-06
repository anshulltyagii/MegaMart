package com.ecommerce.model;

import java.time.LocalDateTime;

public class RecentlyViewed {

	private Long id;
	private Long userId;
	private Long productId;
	private LocalDateTime viewedAt;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public Long getProductId() {
		return productId;
	}

	public void setProductId(Long productId) {
		this.productId = productId;
	}

	public LocalDateTime getViewedAt() {
		return viewedAt;
	}

	public void setViewedAt(LocalDateTime viewedAt) {
		this.viewedAt = viewedAt;
	}
}