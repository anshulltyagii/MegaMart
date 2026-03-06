package com.ecommerce.repository;

import com.ecommerce.model.ProductImage;
import java.util.List;
import java.util.Optional;

public interface ProductImageRepository {

	Long save(ProductImage img);

	boolean update(ProductImage img);

	boolean softDelete(Long id);

	Optional<ProductImage> findById(Long id);

	List<ProductImage> findByProductId(Long productId);

	List<ProductImage> findAllByProductIdIncludeDeleted(Long productId);

	boolean clearPrimaryForProduct(Long productId);

	boolean setPrimaryImage(Long productId, Long imageId);

	Integer findMaxSortOrder(Long productId);

	Long findProductIdByImageId(Long imageId);

}