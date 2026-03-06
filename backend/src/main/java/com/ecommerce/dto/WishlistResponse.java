package com.ecommerce.dto;

import java.time.LocalDateTime;

public class WishlistResponse {

	private Long id;
	private Long userId;
	private Long productId;
	private String productName;
	private double price;
	private String image;
	private LocalDateTime addedAt;

	public WishlistResponse() {
		super();
	}

	public WishlistResponse(Long id, Long userId, Long productId, String productName, double price, String image,
			LocalDateTime addedAt) {
		super();
		this.id = id;
		this.userId = userId;
		this.productId = productId;
		this.productName = productName;
		this.price = price;
		this.image = image;
		this.addedAt = addedAt;
	}

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

	public String getProductName() {
		return productName;
	}

	public void setProductName(String productName) {
		this.productName = productName;
	}

	public double getPrice() {
		return price;
	}

	public void setPrice(double price) {
		this.price = price;
	}

	public String getImage() {
		return image;
	}

	public void setImage(String image) {
		this.image = image;
	}

	public LocalDateTime getAddedAt() {
		return addedAt;
	}

	public void setAddedAt(LocalDateTime addedAt) {
		this.addedAt = addedAt;
	}

}