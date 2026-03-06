
package com.ecommerce.service.impl;

import java.util.List;

import com.ecommerce.dto.*;
import com.ecommerce.model.*;

public class DtoMapper {
	public static ShopResponse shopToResponse(Shop s) {
		if (s == null)
			return null;

		ShopResponse r = new ShopResponse();
		r.setId(s.getId());
		r.setOwnerUserId(s.getOwnerUserId());
		r.setName(s.getName());
		r.setDescription(s.getDescription());
		r.setAddress(s.getAddress());
		r.setIsApproved(s.getIsApproved());
		r.setIsActive(s.getIsActive());
		r.setCreatedAt(s.getCreatedAt());

		return r;
	}

	public static CouponResponse couponToResponse(Coupon c) {
		if (c == null)
			return null;

		CouponResponse r = new CouponResponse();
		r.setId(c.getId());
		r.setCode(c.getCode());

		if (c.getDiscountType() != null) {
			r.setDiscountType(c.getDiscountType().name());
		}

		if (c.getDiscountValue() != null) {
			r.setDiscountValue(c.getDiscountValue().doubleValue());
		} else {
			r.setDiscountValue(0.0);
		}

		if (c.getMinOrderAmount() != null) {
			r.setMinOrderAmount(c.getMinOrderAmount().doubleValue());
		} else {
			r.setMinOrderAmount(0.0);
		}

		r.setValidFrom(c.getValidFrom());
		r.setValidTo(c.getValidTo());
		r.setActive(c.isActive());
		r.setShopId(c.getShopId());

		return r;
	}

	public static AdminLogResponse adminLogToResponse(AdminLog a) {
		if (a == null)
			return null;

		AdminLogResponse r = new AdminLogResponse();
		r.setId(a.getId());
		r.setAdminUserId(a.getAdminUserId());
		r.setAction(a.getAction());
		r.setCreatedAt(a.getCreatedAt());

		return r;
	}

	public static OrderResponse orderToResponse(Order o, List<OrderItemResponse> items) {
		OrderResponse r = new OrderResponse();
		r.setOrderId(o.getId());
		r.setOrderNumber(o.getOrderNumber());
		r.setTotalAmount(o.getTotalAmount());
		r.setStatus(o.getStatus());
		r.setPaymentStatus(o.getPaymentStatus());
		r.setShippingAddress(o.getShippingAddress());
		r.setCreatedAt(o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
		r.setItems(items);
		return r;
	}

}
