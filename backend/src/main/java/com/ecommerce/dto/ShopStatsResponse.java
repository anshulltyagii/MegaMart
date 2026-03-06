package com.ecommerce.dto;

import lombok.Data;
import java.util.List;

@Data
public class ShopStatsResponse {

	private double totalRevenue;
	private int totalOrders;
	private int totalProducts;
	private int customers;
	private double todayRevenue;

	private List<Double> last7Days;

	public double getTotalRevenue() {
		return totalRevenue;
	}

	public void setTotalRevenue(double totalRevenue) {
		this.totalRevenue = totalRevenue;
	}

	public int getTotalOrders() {
		return totalOrders;
	}

	public void setTotalOrders(int totalOrders) {
		this.totalOrders = totalOrders;
	}

	public int getTotalProducts() {
		return totalProducts;
	}

	public void setTotalProducts(int totalProducts) {
		this.totalProducts = totalProducts;
	}

	public int getCustomers() {
		return customers;
	}

	public void setCustomers(int customers) {
		this.customers = customers;
	}

	public double getTodayRevenue() {
		return todayRevenue;
	}

	public void setTodayRevenue(double todayRevenue) {
		this.todayRevenue = todayRevenue;
	}

	public List<Double> getLast7Days() {
		return last7Days;
	}

	public void setLast7Days(List<Double> last7Days) {
		this.last7Days = last7Days;
	}

}