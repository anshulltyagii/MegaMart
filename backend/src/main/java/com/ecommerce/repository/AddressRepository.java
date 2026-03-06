package com.ecommerce.repository;

import com.ecommerce.model.Address;

import java.util.List;
import java.util.Optional;

public interface AddressRepository {

	Long save(Address address);

	boolean update(Address address);

	boolean deleteById(Long id, Long userId);

	Optional<Address> findByIdAndUser(Long id, Long userId);

	List<Address> findAllByUser(Long userId);

	boolean unsetAllDefaults(Long userId);

	boolean setDefault(Long userId, Long addressId);

	boolean existsByIdAndUser(Long id, Long userId);

	int countByUser(Long userId);
}