package com.ecommerce.service;

import com.ecommerce.model.User;
import com.ecommerce.dto.UserRequest;
import com.ecommerce.dto.UserResponse;

import java.util.List;
import java.util.Optional;

public interface UserService {

	UserResponse createUser(UserRequest request);

	UserResponse updateUser(Long id, UserRequest request);

	UserResponse getUserById(Long id);

	Optional<User> getActiveUserByUsername(String username);

	List<UserResponse> getAllActiveUsers();

	List<UserResponse> getAllUsers();

	boolean softDeleteUser(Long id);

	boolean updateAccountStatus(Long id, String status);

	boolean existsByUsername(String username);

	boolean existsByEmail(String email);

	boolean existsByPhone(String phone);

}
