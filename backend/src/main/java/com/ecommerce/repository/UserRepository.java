package com.ecommerce.repository;

import com.ecommerce.model.User;
import java.util.List;
import java.util.Optional;

public interface UserRepository {

	Long save(User user); 

	boolean update(User user);

	boolean softDelete(Long id);

	boolean updateAccountStatus(Long id, String status);

	Optional<User> findById(Long id);

	Optional<User> findActiveByUsername(String username);

	Optional<User> findByEmail(String email);

	List<User> findAllActive();

	List<User> findAll();

	boolean existsByEmail(String email);

	boolean existsByUsername(String username);

	boolean existsByPhone(String phone);

	Optional<User> findActiveByEmail(String email);

}