package com.ecommerce.service.impl;

import com.ecommerce.dto.UserRequest;
import com.ecommerce.dto.UserResponse;

import com.ecommerce.enums.AccountStatus;
import com.ecommerce.enums.UserRole;

import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;

import com.ecommerce.model.User;

import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.UserService;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;

	public UserServiceImpl(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public UserResponse createUser(UserRequest request) {

		if (userRepository.existsByUsername(request.getUsername())) {
			throw new BadRequestException("Username already exists!");
		}

		if (userRepository.existsByEmail(request.getEmail())) {
			throw new BadRequestException("Email already exists!");
		}

		User user = new User();
		user.setUsername(request.getUsername());
		user.setEmail(request.getEmail());
		user.setFullName(request.getFullName());
		user.setPhone(request.getPhone());
		user.setRole(UserRole.valueOf(request.getRole().toUpperCase()));

		user.setAccountStatus(AccountStatus.ACTIVE);

		user.setPasswordHash(request.getPassword());

		Long id = userRepository.save(user);
		user.setId(id);

		return mapToResponse(user);
	}

	@Override
	public UserResponse updateUser(Long id, UserRequest request) {

		User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));

		if (request.getUsername() != null && !request.getUsername().isBlank()) {

			if (!user.getUsername().equals(request.getUsername())
					&& userRepository.existsByUsername(request.getUsername())) {
				throw new BadRequestException("Username already exists!");
			}

			user.setUsername(request.getUsername());
		}

		if (request.getEmail() != null && !request.getEmail().isBlank()) {

			if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
				throw new BadRequestException("Email already exists!");
			}

			user.setEmail(request.getEmail());
		}

		if (request.getFullName() != null) {
			user.setFullName(request.getFullName());
		}

		if (request.getPhone() != null) {
			user.setPhone(request.getPhone());
		}

		if (request.getAccountStatus() != null) {
			user.setAccountStatus(AccountStatus.valueOf(request.getAccountStatus().toUpperCase()));
		}

		userRepository.update(user);

		return mapToResponse(user);
	}

	@Override
	public UserResponse getUserById(Long id) {
		User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));

		return mapToResponse(user);
	}

	@Override
	public Optional<User> getActiveUserByUsername(String username) {
		return userRepository.findActiveByUsername(username);
	}

	@Override
	public List<UserResponse> getAllActiveUsers() {
		return userRepository.findAllActive().stream().map(this::mapToResponse).collect(Collectors.toList());
	}

	@Override
	public List<UserResponse> getAllUsers() {
		return userRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
	}

	@Override
	public boolean softDeleteUser(Long id) {
		// Check exist
		if (userRepository.findById(id).isEmpty()) {
			throw new ResourceNotFoundException("User not found");
		}
		return userRepository.softDelete(id);
	}

	@Override
	public boolean updateAccountStatus(Long id, String status) {

		if (userRepository.findById(id).isEmpty()) {
			throw new ResourceNotFoundException("User not found");
		}

		return userRepository.updateAccountStatus(id, status);
	}

	private UserResponse mapToResponse(User user) {

		UserResponse resp = new UserResponse();

		resp.setId(user.getId());
		resp.setUsername(user.getUsername());
		resp.setEmail(user.getEmail());
		resp.setFullName(user.getFullName());
		resp.setPhone(user.getPhone());
		resp.setRole(user.getRole().name());
		resp.setAccountStatus(user.getAccountStatus().name());
		resp.setCreatedAt(user.getCreatedAt());

		return resp;
	}

	@Override
	public boolean existsByUsername(String username) {
		return userRepository.existsByUsername(username);
	}

	@Override
	public boolean existsByEmail(String email) {
		return userRepository.existsByEmail(email);
	}

	@Override
	public boolean existsByPhone(String phone) {
		return userRepository.existsByPhone(phone);
	}

}
