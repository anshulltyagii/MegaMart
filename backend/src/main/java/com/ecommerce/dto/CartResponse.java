package com.ecommerce.dto;

import com.ecommerce.model.CartItem;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class CartResponse {

	private Long cartId;
	private List<CartItem> items;
	private Integer totalItems;
	private BigDecimal subtotal;
	private BigDecimal discount;
	private BigDecimal total;

	private Map<Long, List<CartItem>> itemsByShop;

	private boolean hasInvalidItems;
	private boolean hasPriceChanges;
	private List<String> warnings;

	public CartResponse() {
	}

	public Long getCartId() {
		return cartId;
	}

	public void setCartId(Long cartId) {
		this.cartId = cartId;
	}

	public List<CartItem> getItems() {
		return items;
	}

	public void setItems(List<CartItem> items) {
		this.items = items;
	}

	public Integer getTotalItems() {
		return totalItems;
	}

	public void setTotalItems(Integer totalItems) {
		this.totalItems = totalItems;
	}

	public BigDecimal getSubtotal() {
		return subtotal;
	}

	public void setSubtotal(BigDecimal subtotal) {
		this.subtotal = subtotal;
	}

	public BigDecimal getDiscount() {
		return discount;
	}

	public void setDiscount(BigDecimal discount) {
		this.discount = discount;
	}

	public BigDecimal getTotal() {
		return total;
	}

	public void setTotal(BigDecimal total) {
		this.total = total;
	}

	public Map<Long, List<CartItem>> getItemsByShop() {
		return itemsByShop;
	}

	public void setItemsByShop(Map<Long, List<CartItem>> itemsByShop) {
		this.itemsByShop = itemsByShop;
	}

	public boolean isHasInvalidItems() {
		return hasInvalidItems;
	}

	public void setHasInvalidItems(boolean hasInvalidItems) {
		this.hasInvalidItems = hasInvalidItems;
	}

	public boolean isHasPriceChanges() {
		return hasPriceChanges;
	}

	public void setHasPriceChanges(boolean hasPriceChanges) {
		this.hasPriceChanges = hasPriceChanges;
	}

	public List<String> getWarnings() {
		return warnings;
	}

	public void setWarnings(List<String> warnings) {
		this.warnings = warnings;
	}

	@Override
	public String toString() {
		return "CartResponse{" + "cartId=" + cartId + ", totalItems=" + totalItems + ", subtotal=" + subtotal
				+ ", total=" + total + ", hasInvalidItems=" + hasInvalidItems + ", hasPriceChanges=" + hasPriceChanges
				+ '}';
	}
}