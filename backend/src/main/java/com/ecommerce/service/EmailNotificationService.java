package com.ecommerce.service;

import com.ecommerce.dto.EmailNotificationResponse;
import com.ecommerce.dto.EmailSendRequest;

import java.util.List;

public interface EmailNotificationService {

	EmailNotificationResponse sendEmail(Long userId, EmailSendRequest request);

	boolean updateStatus(Long notificationId, String status);

	EmailNotificationResponse getNotificationById(Long id);

	List<EmailNotificationResponse> getAllByUser(Long userId);

	List<EmailNotificationResponse> getAllNotifications();
}