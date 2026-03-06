package com.ecommerce.service;

import com.ecommerce.dto.ReturnRequestDTO;
import com.ecommerce.model.ReturnRequest;

import java.util.List;

public interface ReturnService {

	List<ReturnRequest> getUserReturnRequests(Long userId);

	void requestReturn(Long userId, ReturnRequestDTO requestDto);

	ReturnRequest getReturnByOrderId(Long userId, Long orderId);

	void approveReturn(Long returnRequestId);

	void rejectReturn(Long returnRequestId);
}