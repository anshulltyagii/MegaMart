package com.ecommerce.service.impl;

import com.ecommerce.dto.OrderItemResponse;
import com.ecommerce.dto.ReturnRequestDTO;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.exception.UnauthorizedException;
import com.ecommerce.model.Order;
import com.ecommerce.model.ReturnRequest;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ReturnRepository;
import com.ecommerce.service.InventoryService;
import com.ecommerce.service.ReturnService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;


@Service
public class ReturnServiceImpl implements ReturnService {

    private static final Logger log = LoggerFactory.getLogger(ReturnServiceImpl.class);
    private static final int RETURN_WINDOW_DAYS = 7;
    private static final int MIN_REASON_LENGTH = 10;

    private final ReturnRepository returnRepository;
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;

    public ReturnServiceImpl(ReturnRepository returnRepository, 
                             OrderRepository orderRepository,
                             InventoryService inventoryService) {
        this.returnRepository = returnRepository;
        this.orderRepository = orderRepository;
        this.inventoryService = inventoryService;
        
        log.info("---------------------------------------------------");
        log.info("ReturnService Initialized");
        log.info("Return Window: {} days from last order activity", RETURN_WINDOW_DAYS);
        log.info("Policy: Customer-friendly - window extends with admin activity");
        log.info("---------------------------------------------------");
    }

    @Override
    @Transactional
    public void requestReturn(Long userId, ReturnRequestDTO requestDto) {
        log.info("Processing return request - User: {}, Order: {}", userId, requestDto.getOrderId());
        
       if (requestDto.getOrderId() == null) {
            throw new BadRequestException("Order ID is required");
        }
        
        if (requestDto.getReason() == null || requestDto.getReason().isBlank()) {
            throw new BadRequestException("Return reason is required");
        }
        
        if (requestDto.getReason().trim().length() < MIN_REASON_LENGTH) {
            throw new BadRequestException(
                "Return reason must be at least " + MIN_REASON_LENGTH + " characters. " +
                "Please provide specific details about the issue."
            );
        }

          Order order = orderRepository.findById(requestDto.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Order not found with ID: " + requestDto.getOrderId()
                ));

         if (!order.getUserId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to return this order");
        }
        
        if (!"DELIVERED".equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException(
                "Returns are only allowed for delivered orders. Current status: " + order.getStatus()
            );
        }
        
        if ("RETURNED".equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException("This order has already been returned");
        }

         if (order.getUpdatedAt() != null) {
            LocalDateTime lastActivity = order.getUpdatedAt();
            LocalDateTime returnDeadline = lastActivity.plusDays(RETURN_WINDOW_DAYS);
            LocalDateTime now = LocalDateTime.now();
            
            if (now.isAfter(returnDeadline)) {
                long daysSinceActivity = Duration.between(lastActivity, now).toDays();
                throw new BadRequestException(
                    "Return window has closed. Last order activity was " + daysSinceActivity + 
                    " days ago. Returns are accepted within " + RETURN_WINDOW_DAYS + 
                    " days of last activity to ensure fairness during issue resolution."
                );
            }
            
            long daysRemaining = Duration.between(now, returnDeadline).toDays();
            log.info("Return window valid. {} days remaining for order {}", daysRemaining, order.getId());
            
        } else {
            log.warn("Order {} has no updatedAt timestamp. Using createdAt as fallback.", order.getId());
            
            if (order.getCreatedAt() != null) {
                LocalDateTime deadline = order.getCreatedAt().plusDays(RETURN_WINDOW_DAYS + 5);
                if (LocalDateTime.now().isAfter(deadline)) {
                    throw new BadRequestException(
                        "Return window has closed based on order age. " +
                        "Please contact support if you believe this is an error."
                    );
                }
            } else {
                log.error("Order {} has no createdAt or updatedAt timestamps!", order.getId());
                throw new BadRequestException(
                    "Unable to verify return window due to missing order timestamps. " +
                    "Please contact support."
                );
            }
        }

      if (returnRepository.existsByOrderId(order.getId())) {
            throw new BadRequestException(
                "A return request already exists for this order. " +
                "Please check your return history or contact support."
            );
        }

         
        ReturnRequest returnRequest = new ReturnRequest();
        returnRequest.setOrderId(order.getId());
        returnRequest.setReason(requestDto.getReason().trim());
        returnRequest.setStatus("REQUESTED");
        returnRequest.setCreatedAt(LocalDateTime.now());
        
        ReturnRequest saved = returnRepository.save(returnRequest);
        
        log.info(" Return request created successfully - ID: {}, Order: {}", saved.getId(), order.getId());
    }

     @Override
    @Transactional
    public void approveReturn(Long returnRequestId) {
        log.info("-----------------------------------------------------------");
        log.info("Approving return request: {}", returnRequestId);
        log.info("-----------------------------------------------------------");
        
           ReturnRequest req = returnRepository.findById(returnRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Return request not found with ID: " + returnRequestId
                ));

        if (!"REQUESTED".equalsIgnoreCase(req.getStatus())) {
            throw new BadRequestException(
                "Cannot approve return. Current status: " + req.getStatus() + 
                ". Only REQUESTED returns can be approved."
            );
        }

         
        req.setStatus("APPROVED");
        returnRepository.update(req);
        log.info(" Return request status updated to APPROVED");

         
        Long orderId = req.getOrderId();
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Order not found with ID: " + orderId + ". This is a data integrity issue."
                ));
        
        log.info("Order details - ID: {}, Amount: Rs{}, Status: {}", 
                order.getId(), order.getTotalAmount(), order.getStatus());

         
        orderRepository.updateOrderStatus(orderId, "RETURNED");
        log.info(" Order status updated to RETURNED");
        
        orderRepository.updatePaymentStatus(orderId, "REFUNDED", "RETURNED");
        log.info(" Payment status updated to REFUNDED (Amount: Rs{})", order.getTotalAmount());

         
        log.info("Restocking inventory for order: {}", orderId);
        List<OrderItemResponse> items = orderRepository.findItemsByOrderId(orderId);
        
        if (items == null || items.isEmpty()) {
            log.warn(" No items found for order {}. Skipping inventory restock.", orderId);
            log.warn("This may indicate a data integrity issue - manual review recommended.");
        } else {
            int successCount = 0;
            int failCount = 0;
            
            for (OrderItemResponse item : items) {
                try {
                    inventoryService.addStock(item.getProductId(), item.getQuantity());
                    successCount++;
                    log.info("   Product {}: Restocked {} units", item.getProductId(), item.getQuantity());
                    
                } catch (ResourceNotFoundException e) {
                    failCount++;
                    log.error("   Product {}: Not found in inventory - {}", 
                            item.getProductId(), e.getMessage());
                    
                } catch (Exception e) {
                    failCount++;
                    log.error("   Product {}: Restock failed - {}", 
                            item.getProductId(), e.getMessage());
                }
            }
            
            log.info(" Inventory restock summary: {} succeeded, {} failed", successCount, failCount);
            
            if (failCount > 0) {
                log.warn(" {} item(s) failed to restock. Manual inventory review recommended.", failCount);
            }
        }
        
        log.info("---------------------------------------------------------");
        log.info("RETURN APPROVED SUCCESSFULLY");
        log.info("  Return ID: {}", returnRequestId);
        log.info("  Order ID: {}", orderId);
        log.info("  Refund Amount: Rs.{}", order.getTotalAmount());
        log.info("  Status: RETURNED | Payment: REFUNDED | Inventory: Processed");
        log.info("----------------------------------------------------------------");
    }

    @Override
    @Transactional
    public void rejectReturn(Long returnRequestId) {
        log.info("Rejecting return request: {}", returnRequestId);
        
       ReturnRequest req = returnRepository.findById(returnRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Return request not found with ID: " + returnRequestId
                ));

        if (!"REQUESTED".equalsIgnoreCase(req.getStatus())) {
            throw new BadRequestException(
                "Cannot reject return. Current status: " + req.getStatus() + 
                ". Only REQUESTED returns can be rejected."
            );
        }

        
        req.setStatus("REJECTED");
        returnRepository.update(req);
        
        log.info(" Return request {} rejected successfully", returnRequestId);
    }

   
    @Override
    public List<ReturnRequest> getUserReturnRequests(Long userId) {
        log.info("Fetching return requests for user: {}", userId);
        
        if (userId == null || userId <= 0) {
            throw new BadRequestException("Invalid user ID");
        }
        
        List<ReturnRequest> requests = returnRepository.findByUserId(userId);
        log.info("Found {} return requests for user {}", requests.size(), userId);
        
        return requests;
    }

    @Override
    public ReturnRequest getReturnByOrderId(Long userId, Long orderId) {
        log.info("Fetching return for user {} and order {}", userId, orderId);
        
        if (userId == null || userId <= 0) {
            throw new BadRequestException("Invalid user ID");
        }
        if (orderId == null || orderId <= 0) {
            throw new BadRequestException("Invalid order ID");
        }
        
        ReturnRequest returnRequest = returnRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "No return request found for order ID: " + orderId
                ));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (!order.getUserId().equals(userId)) {
            throw new UnauthorizedException("You are not authorized to view this return request");
        }
        
        return returnRequest;
    }
}