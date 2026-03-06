package com.ecommerce.service.impl;

import com.ecommerce.dto.ProductImageRequest;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.ProductImage;
import com.ecommerce.repository.ProductImageRepository;
import com.ecommerce.service.ProductImageService;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class ProductImageServiceImpl implements ProductImageService {

	private final ProductImageRepository repo;

	public ProductImageServiceImpl(ProductImageRepository repo) {
		this.repo = repo;
	}

	@Override
	public ProductImage addImageToProduct(Long productId, ProductImageRequest req) {

		if (req.getImagePath() == null || req.getImagePath().isBlank())
			throw new BadRequestException("Image path required.");

		Integer max = repo.findMaxSortOrder(productId);
		int nextOrder = max + 1;

		ProductImage img = new ProductImage();
		img.setProductId(productId);
		img.setImagePath(req.getImagePath());
		img.setPrimary(req.getPrimary() != null && req.getPrimary());
		img.setSortImageOrder(nextOrder);
		img.setDeleted(false);

		Long id = repo.save(img);
		img.setId(id);

		return img;
	}

	@Override
	public ProductImage uploadAndSave(Long productId, MultipartFile file) {

		if (file.isEmpty()) {
			throw new BadRequestException("File is empty");
		}

		try {
			String root = System.getProperty("user.dir");
			String folderPath = root + "/product-images/" + productId;

			File folder = new File(folderPath);
			if (!folder.exists())
				folder.mkdirs();

			String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
			Path path = Paths.get(folderPath + "/" + fileName);
			Files.copy(file.getInputStream(), path);

			String dbPath = "/product-images/" + productId + "/" + fileName;

			// AUTO PRIMARY FOR FIRST IMAGE
			List<ProductImage> existingImages = repo.findByProductId(productId);
			boolean firstImage = existingImages.isEmpty();
			boolean isPrimary = firstImage; // set true only for first image

			// auto increment sort order
			Integer max = repo.findMaxSortOrder(productId);
			int nextOrder = max + 1;

			ProductImage img = new ProductImage();
			img.setProductId(productId);
			img.setImagePath(dbPath);
			img.setPrimary(isPrimary);
			img.setSortImageOrder(nextOrder);
			img.setDeleted(false);

			Long id = repo.save(img);
			img.setId(id);

			return img;

		} catch (Exception e) {
			throw new BadRequestException("Image upload failed: " + e.getMessage());
		}
	}

	@Override
	public List<ProductImage> getImagesByProduct(Long productId) {
		return repo.findByProductId(productId);
	}

	@Override
	public ProductImage updateImage(Long imageId, ProductImageRequest req) {

		ProductImage existing = repo.findById(imageId)
				.orElseThrow(() -> new ResourceNotFoundException("Image not found"));

		if (req.getImagePath() != null)
			existing.setImagePath(req.getImagePath());

		if (req.getPrimary() != null)
			existing.setPrimary(req.getPrimary());

		if (req.getSortImageOrder() != null)
			existing.setSortImageOrder(req.getSortImageOrder());

		repo.update(existing);
		return existing;
	}

	@Override
	public void softDeleteImage(Long imageId) {
		ProductImage existing = repo.findById(imageId)
				.orElseThrow(() -> new ResourceNotFoundException("Image not found"));

		repo.softDelete(existing.getId());
	}

	@Override
	public void setPrimaryImage(Long productId, Long imageId) {

		ProductImage existing = repo.findById(imageId)
				.orElseThrow(() -> new ResourceNotFoundException("Image not found"));

		if (!existing.getProductId().equals(productId))
			throw new ResourceNotFoundException("Image does not belong to product");

		repo.setPrimaryImage(productId, imageId);
	}

	@Override
	public Long getProductIdByImageId(Long imageId) {
		return repo.findProductIdByImageId(imageId);
	}

}