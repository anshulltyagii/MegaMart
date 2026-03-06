package com.ecommerce.service;

import com.ecommerce.dto.ProductImageRequest;
import com.ecommerce.model.ProductImage;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProductImageService {

	ProductImage addImageToProduct(Long productId, ProductImageRequest req);

	ProductImage uploadAndSave(Long productId, MultipartFile file);

	List<ProductImage> getImagesByProduct(Long productId);

	ProductImage updateImage(Long imageId, ProductImageRequest req);

	void softDeleteImage(Long imageId);

	void setPrimaryImage(Long productId, Long imageId);

	Long getProductIdByImageId(Long imageId);

}