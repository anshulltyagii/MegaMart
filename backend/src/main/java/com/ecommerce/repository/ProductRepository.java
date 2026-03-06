package com.ecommerce.repository;

import com.ecommerce.model.Product;
import java.util.List;
import java.util.Optional;

public interface ProductRepository {

	Long save(Product product);

	boolean update(Product product);

	boolean softDelete(Long id);

	Optional<Product> findById(Long id);

	List<Product> findAllActive();

	List<Product> findByShopId(Long shopId);

	List<Product> findAll();

	boolean existsBySku(String sku);

	List<Product> search(String q, Long categoryId, int limit, int offset);

	Long findShopOwnerId(Long shopId);

	List<String> searchSuggestions(String query);

}