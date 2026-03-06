package com.ecommerce.repository;

import com.ecommerce.model.EmailNotification;

import java.util.List;
import java.util.Optional;

public interface EmailNotificationRepository {

	Long save(EmailNotification notification);

	boolean updateStatus(Long id, String status);

	Optional<EmailNotification> findById(Long id);

	List<EmailNotification> findAllByUser(Long userId);

	List<EmailNotification> findAll();
}