package com.ecommerce.service.impl;

import com.ecommerce.dto.InventoryResponse;
import com.ecommerce.dto.EmailSendRequest;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.model.Inventory;
import com.ecommerce.model.Product;
import com.ecommerce.repository.InventoryRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.service.EmailNotificationService;
import com.ecommerce.service.InventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class InventoryServiceImpl implements InventoryService {

	private static final Logger log = LoggerFactory.getLogger(InventoryServiceImpl.class);

	private final InventoryRepository inventoryRepo;
	private final EmailNotificationService emailService;
	private final ProductRepository productRepo;
	private final ShopRepository shopRepo;

	public InventoryServiceImpl(InventoryRepository inventoryRepo, EmailNotificationService emailService,
			ProductRepository productRepo, ShopRepository shopRepo) {
		this.inventoryRepo = inventoryRepo;
		this.emailService = emailService;
		this.productRepo = productRepo;
		this.shopRepo = shopRepo;
	}

	@Override
	public InventoryResponse getInventory(Long productId) {
		Optional<Inventory> invOpt = inventoryRepo.findByProductId(productId);
		if (invOpt.isEmpty()) {
			InventoryResponse resp = new InventoryResponse();
			resp.setProductId(productId);
			resp.setQuantity(0);
			resp.setReserved(0);
			resp.setAvailable(0);
			resp.setStockStatus("OUT OF STOCK");
			return resp;
		}
		return mapToResponse(invOpt.get());
	}

	@Override
	@Transactional
	public InventoryResponse createOrInitInventory(Long productId, int quantity) {
		if (quantity < 0)
			throw new BadRequestException("Initial quantity cannot be negative");

		Inventory existing = inventoryRepo.findByProductId(productId).orElse(null);

		if (existing == null) {
			inventoryRepo.createInventory(productId, quantity);
		} else {
			existing.setQuantity(quantity);
			inventoryRepo.update(existing);
		}

		System.out.println("\n---------------------------");
		System.out.println(" INVENTORY UPDATE LOG");
		System.out.println("---------------------------");
		System.out.println("Product ID   : " + productId);
		System.out.println("New Quantity : " + quantity);
		System.out.println("Status       : UPDATED SUCCESSFULLY");
		System.out.println("---------------------------\n");

		return getInventory(productId);
	}

	@Override
	@Transactional
	public InventoryResponse addStock(Long productId, int quantity) {
		if (quantity <= 0)
			throw new BadRequestException("Quantity must be > 0");
		if (inventoryRepo.findByProductId(productId).isEmpty()) {
			return createOrInitInventory(productId, quantity);
		}
		if (!inventoryRepo.increaseStock(productId, quantity))
			throw new BadRequestException("Failed to increase stock");
		return getInventory(productId);
	}

	@Override
	@Transactional
	public InventoryResponse decreaseStock(Long productId, int quantity) {
		if (quantity <= 0)
			throw new BadRequestException("Quantity must be > 0");
		ensureInventoryExists(productId);
		if (!inventoryRepo.decreaseStock(productId, quantity))
			throw new BadRequestException("Not enough stock");
		return getInventory(productId);
	}

	@Override
	@Transactional
	public InventoryResponse reserveStock(Long productId, int quantity) {
		if (quantity <= 0)
			throw new BadRequestException("Quantity must be > 0");
		ensureInventoryExists(productId);

		boolean success = inventoryRepo.reserveStock(productId, quantity);

		if (!success) {
			notifyShopkeeperOfLowStock(productId, quantity);
			Inventory inv = inventoryRepo.findByProductId(productId).orElse(null);
			int available = (inv != null) ? (inv.getQuantity() - inv.getReserved()) : 0;
			throw new BadRequestException("Insufficient stock. Only " + available + " units left.");
		}
		return getInventory(productId);
	}

	private void notifyShopkeeperOfLowStock(Long productId, int requestedQty) {
		try {
			Product product = productRepo.findById(productId).orElse(null);
			if (product == null)
				return;
			Long ownerId = productRepo.findShopOwnerId(product.getShopId());
			if (ownerId == null)
				return;

			EmailSendRequest emailReq = new EmailSendRequest();
			emailReq.setSubject(" URGENT: Low Stock Alert for " + product.getName());
			emailReq.setMessage("Hello Shopkeeper,\n\nA customer attempted to buy " + requestedQty + " units of '"
					+ product.getName() + "' (SKU: " + product.getSku()
					+ "), but you have insufficient stock.\n\nPlease restock immediately to avoid losing sales.");

			emailService.sendEmail(ownerId, emailReq);
			log.info("Sent Low Stock Alert to Shopkeeper ID: {}", ownerId);
		} catch (Exception e) {
			log.error("Failed to send low stock alert: {}", e.getMessage());
		}
	}

	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public InventoryResponse releaseReserved(Long productId, int quantity) {
		if (quantity <= 0)
			throw new BadRequestException("Quantity must be > 0");
		ensureInventoryExists(productId);
		if (!inventoryRepo.releaseReservedStock(productId, quantity))
			throw new BadRequestException("Not enough reserved stock");
		return getInventory(productId);
	}

	@Override
	@Transactional
	public InventoryResponse consumeReservedOnOrder(Long productId, int quantity) {
		if (quantity <= 0)
			throw new BadRequestException("Quantity must be > 0");
		ensureInventoryExists(productId);
		if (!inventoryRepo.consumeReservedOnOrder(productId, quantity))
			throw new BadRequestException("Failed to consume reserved stock");
		return getInventory(productId);
	}

	private void ensureInventoryExists(Long productId) {
		if (inventoryRepo.findByProductId(productId).isEmpty()) {
			createOrInitInventory(productId, 0);
		}
	}

	private InventoryResponse mapToResponse(Inventory inv) {
		InventoryResponse resp = new InventoryResponse();
		resp.setProductId(inv.getProductId());
		resp.setQuantity(inv.getQuantity());
		resp.setReserved(inv.getReserved());
		int available = inv.getQuantity() - inv.getReserved();
		resp.setAvailable(available);
		if (available <= 0)
			resp.setStockStatus("OUT OF STOCK");
		else if (available <= 5)
			resp.setStockStatus("ONLY FEW LEFT");
		else
			resp.setStockStatus("IN STOCK");
		return resp;
	}
}