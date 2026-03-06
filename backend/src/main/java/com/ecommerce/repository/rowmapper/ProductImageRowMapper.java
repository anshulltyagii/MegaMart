package com.ecommerce.repository.rowmapper;

import com.ecommerce.model.ProductImage;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ProductImageRowMapper implements RowMapper<ProductImage> {

	@Override
	public ProductImage mapRow(ResultSet rs, int rowNum) throws SQLException {

		ProductImage img = new ProductImage();

		img.setId(rs.getLong("id"));
		img.setProductId(rs.getLong("product_id"));
		img.setImagePath(rs.getString("image_path"));
		img.setPrimary(rs.getBoolean("is_primary"));
		img.setSortImageOrder(rs.getInt("sort_image_order"));
		img.setDeleted(rs.getBoolean("is_deleted"));

		return img;
	}
}