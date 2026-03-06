package com.ecommerce.repository.impl;

import com.ecommerce.model.ProductImage;
import com.ecommerce.repository.ProductImageRepository;
import com.ecommerce.repository.rowmapper.ProductImageRowMapper;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductImageRepositoryImpl implements ProductImageRepository {

	private final JdbcTemplate jdbc;

	public ProductImageRepositoryImpl(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public Long save(ProductImage img) {
		String sql = """
				INSERT INTO product_images
				(product_id, image_path, is_primary, sort_image_order, is_deleted)
				VALUES (?, ?, ?, ?, ?)
				""";

		KeyHolder key = new GeneratedKeyHolder();

		jdbc.update(con -> {
			PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
			ps.setLong(1, img.getProductId());
			ps.setString(2, img.getImagePath());
			ps.setBoolean(3, img.isPrimary());
			ps.setInt(4, img.getSortImageOrder());
			ps.setBoolean(5, img.isDeleted());
			return ps;
		}, key);

		return key.getKey().longValue();
	}

	@Override
	public boolean update(ProductImage img) {
		String sql = """
				UPDATE product_images SET
				image_path=?, is_primary=?, sort_image_order=?, is_deleted=?
				WHERE id=?
				""";

		return jdbc.update(sql, img.getImagePath(), img.isPrimary(), img.getSortImageOrder(), img.isDeleted(),
				img.getId()) > 0;
	}

	@Override
	public boolean softDelete(Long id) {
		return jdbc.update("UPDATE product_images SET is_deleted=TRUE WHERE id=?", id) > 0;
	}

	@Override
	public Optional<ProductImage> findById(Long id) {
		List<ProductImage> list = jdbc.query("SELECT * FROM product_images WHERE id=?", new ProductImageRowMapper(),
				id);
		return list.stream().findFirst();
	}

	@Override
	public List<ProductImage> findByProductId(Long productId) {
		String sql = """
				SELECT * FROM product_images
				WHERE product_id=? AND is_deleted=FALSE
				ORDER BY sort_image_order ASC, id ASC
				""";
		return jdbc.query(sql, new ProductImageRowMapper(), productId);
	}

	@Override
	public List<ProductImage> findAllByProductIdIncludeDeleted(Long productId) {
		String sql = """
				SELECT * FROM product_images
				WHERE product_id=?
				ORDER BY sort_image_order ASC, id ASC
				""";
		return jdbc.query(sql, new ProductImageRowMapper(), productId);
	}

	@Override
	public boolean clearPrimaryForProduct(Long productId) {
		return jdbc.update("UPDATE product_images SET is_primary=FALSE WHERE product_id=?", productId) > 0;
	}

	@Override
	public boolean setPrimaryImage(Long productId, Long imageId) {

		clearPrimaryForProduct(productId);

		return jdbc.update("""
				UPDATE product_images SET is_primary=TRUE
				WHERE id=? AND product_id=? AND is_deleted=FALSE
				""", imageId, productId) > 0;
	}

	@Override
	public Integer findMaxSortOrder(Long productId) {
		String sql = """
				SELECT COALESCE(MAX(sort_image_order), -1)
				FROM product_images
				WHERE product_id=? AND is_deleted=FALSE
				""";
		return jdbc.queryForObject(sql, Integer.class, productId);
	}

	@Override
	public Long findProductIdByImageId(Long imageId) {
		String sql = "SELECT product_id FROM product_images WHERE id = ?";
		try {
			return jdbc.queryForObject(sql, Long.class, imageId);
		} catch (Exception e) {
			return null;
		}
	}

}