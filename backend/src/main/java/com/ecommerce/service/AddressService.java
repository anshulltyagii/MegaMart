package com.ecommerce.service;

import com.ecommerce.dto.AddressRequest;
import com.ecommerce.dto.AddressResponse;

import java.util.List;

public interface AddressService {

	AddressResponse createAddress(Long userId, AddressRequest request);

	AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request);

	AddressResponse getAddress(Long userId, Long addressId);

	List<AddressResponse> getAllAddresses(Long userId);

	boolean deleteAddress(Long userId, Long addressId);

	boolean setDefaultAddress(Long userId, Long addressId);
}