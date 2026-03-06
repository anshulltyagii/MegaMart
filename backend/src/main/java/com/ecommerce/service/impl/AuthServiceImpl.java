package com.ecommerce.service.impl;

import com.ecommerce.dto.LoginRequest;
import com.ecommerce.dto.ResetPasswordRequest;
import com.ecommerce.dto.UserRequest;
import com.ecommerce.dto.UserResponse;
import com.ecommerce.enums.AccountStatus;
import com.ecommerce.enums.UserRole;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.UnauthorizedException;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.AuthService;
import com.ecommerce.util.JwtUtil;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthServiceImpl implements AuthService {

	private final UserRepository userRepository;
	private final JwtUtil jwtUtil;

	public AuthServiceImpl(UserRepository userRepository, JwtUtil jwtUtil) {
		this.userRepository = userRepository;
		this.jwtUtil = jwtUtil;
	}

	@Override
	public UserResponse register(UserRequest req) {

		if (userRepository.existsByUsername(req.getUsername())) {
			throw new BadRequestException("Username already exists!");
		}

		if (userRepository.existsByEmail(req.getEmail())) {
			throw new BadRequestException("Email already exists!");
		}

		User user = new User();
		user.setUsername(req.getUsername());
		user.setEmail(req.getEmail());
		user.setFullName(req.getFullName());
		user.setPhone(req.getPhone());
		user.setRole(UserRole.valueOf(req.getRole().toUpperCase()));
		user.setAccountStatus(AccountStatus.ACTIVE);
		user.setCreatedAt(LocalDateTime.now());

		String hashed = BCrypt.hashpw(req.getPassword(), BCrypt.gensalt());
		user.setPasswordHash(hashed);

		Long id = userRepository.save(user);
		user.setId(id);

		return toResponse(user);
	}

	@Override
	public String login(LoginRequest req) {

		String input = req.getIdentifier();

		if (input == null || input.isBlank()) {
			throw new BadRequestException("Identifier cannot be empty");
		}

		User user;

		if (input.contains("@")) {
			user = userRepository.findActiveByEmail(input)
					.orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
		} else {
			user = userRepository.findActiveByUsername(input)
					.orElseThrow(() -> new UnauthorizedException("Invalid username or password"));
		}

		if (!BCrypt.checkpw(req.getPassword(), user.getPasswordHash())) {
			throw new UnauthorizedException("Invalid credentials");
		}

		return jwtUtil.generateToken(user);
	}

	private UserResponse toResponse(User user) {
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
	public String resetPassword(ResetPasswordRequest req) {

		User user = userRepository.findActiveByEmail(req.getEmail())
				.orElseThrow(() -> new BadRequestException("User not found with email"));

		String newHash = BCrypt.hashpw(req.getNewPassword(), BCrypt.gensalt());
		user.setPasswordHash(newHash);

		userRepository.update(user);
		return "Password updated successfully!";
	}

}