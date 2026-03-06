package com.ecommerce.service;

import com.ecommerce.dto.LoginRequest;
import com.ecommerce.dto.ResetPasswordRequest;
import com.ecommerce.dto.UserRequest;
import com.ecommerce.dto.UserResponse;

public interface AuthService {

	UserResponse register(UserRequest request);

	String login(LoginRequest request);

	String resetPassword(ResetPasswordRequest req);

}
