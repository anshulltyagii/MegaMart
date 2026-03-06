package com.ecommerce.dto;

public class ProductImageRequest {

	private String imagePath;
	private Boolean primary;
	private Integer sortImageOrder;

	public String getImagePath() {
		return imagePath;
	}

	public void setImagePath(String imagePath) {
		this.imagePath = imagePath;
	}

	public Boolean getPrimary() {
		return primary;
	}

	public void setPrimary(Boolean primary) {
		this.primary = primary;
	}

	public Integer getSortImageOrder() {
		return sortImageOrder;
	}

	public void setSortImageOrder(Integer sortImageOrder) {
		this.sortImageOrder = sortImageOrder;
	}
}