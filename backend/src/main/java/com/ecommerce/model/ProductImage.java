package com.ecommerce.model;

public class ProductImage {

	private Long id;
	private Long productId;

	private String imagePath;
	private boolean isPrimary;
	private int sortImageOrder;
	private boolean isDeleted;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getProductId() {
		return productId;
	}

	public void setProductId(Long productId) {
		this.productId = productId;
	}

	public String getImagePath() {
		return imagePath;
	}

	public void setImagePath(String imagePath) {
		this.imagePath = imagePath;
	}

	public boolean isPrimary() {
		return isPrimary;
	}

	public void setPrimary(boolean primary) {
		isPrimary = primary;
	}

	public int getSortImageOrder() {
		return sortImageOrder;
	}

	public void setSortImageOrder(int sortImageOrder) {
		this.sortImageOrder = sortImageOrder;
	}

	public boolean isDeleted() {
		return isDeleted;
	}

	public void setDeleted(boolean deleted) {
		isDeleted = deleted;
	}
}