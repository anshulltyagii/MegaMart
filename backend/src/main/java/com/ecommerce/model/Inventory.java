package com.ecommerce.model;

public class Inventory {

	private Long productId;
	private Integer quantity;
	private Integer reserved;

	public Long getProductId() {
		return productId;
	}

	public void setProductId(Long productId) {
		this.productId = productId;
	}

	public Integer getQuantity() {
		return quantity;
	}

	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}

	public Integer getReserved() {
		return reserved;
	}

	public void setReserved(Integer reserved) {
		this.reserved = reserved;
	}

	public int getAvailable() {
		if (quantity == null || reserved == null)
			return 0;
		return quantity - reserved;
	}
}