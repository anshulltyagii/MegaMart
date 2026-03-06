package com.ecommerce.service.impl;

import com.ecommerce.dto.UserRequest;
import com.ecommerce.dto.UserResponse;
import com.ecommerce.enums.AccountStatus;
import com.ecommerce.enums.UserRole;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private UserServiceImpl userService;

	private UserRequest validRequest;

	@BeforeEach
	void setup() {
		validRequest = new UserRequest();
		validRequest.setUsername("john");
		validRequest.setEmail("john@mail.com");
		validRequest.setFullName("John Doe");
		validRequest.setPhone("9999999999");
		validRequest.setRole("CUSTOMER");
		validRequest.setPassword("pass123");
	}

	@Test
	void createUser_success() {

		when(userRepository.existsByUsername("john")).thenReturn(false);
		when(userRepository.existsByEmail("john@mail.com")).thenReturn(false);
		when(userRepository.save(any(User.class))).thenReturn(1L);

		UserResponse response = userService.createUser(validRequest);

		assertNotNull(response);
		assertEquals("john", response.getUsername());
		assertEquals("CUSTOMER", response.getRole());
		assertEquals("ACTIVE", response.getAccountStatus());
	}

	@Test
	void createUser_duplicateUsername_throwsException() {

		when(userRepository.existsByUsername("john")).thenReturn(true);

		BadRequestException ex = assertThrows(BadRequestException.class, () -> userService.createUser(validRequest));

		assertEquals("Username already exists!", ex.getMessage());
	}

	@Test
	void getUserById_success() {

		User user = new User();
		user.setId(1L);
		user.setUsername("john");
		user.setEmail("john@mail.com");
		user.setRole(UserRole.CUSTOMER);
		user.setAccountStatus(AccountStatus.ACTIVE);

		when(userRepository.findById(1L)).thenReturn(Optional.of(user));

		UserResponse response = userService.getUserById(1L);

		assertEquals("john", response.getUsername());
		assertEquals("ACTIVE", response.getAccountStatus());
	}

	@Test
	void getUserById_notFound_throwsException() {

		when(userRepository.findById(1L)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> userService.getUserById(1L));
	}

	@Test
	void softDeleteUser_success() {

		when(userRepository.findById(1L)).thenReturn(Optional.of(new User()));

		when(userRepository.softDelete(1L)).thenReturn(true);

		boolean result = userService.softDeleteUser(1L);

		assertTrue(result);
		verify(userRepository).softDelete(1L);
	}
}