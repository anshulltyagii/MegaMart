package com.ecommerce.repository.impl;

import com.ecommerce.model.Address;
import com.ecommerce.repository.AddressRepository;
import com.ecommerce.repository.rowmapper.AddressRowMapper;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class AddressRepositoryImpl implements AddressRepository {

	private final JdbcTemplate jdbcTemplate;

	public AddressRepositoryImpl(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public Long save(Address address) {
		String sql = """
				    INSERT INTO addresses (
				        user_id, full_name, phone, pincode,
				        address_line1, address_line2,
				        city, state, landmark,
				        address_type, is_default
				    )
				    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				""";

		KeyHolder keyHolder = new GeneratedKeyHolder();

		jdbcTemplate.update(con -> {
			PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);

			ps.setLong(1, address.getUserId());
			ps.setString(2, address.getFullName());
			ps.setString(3, address.getPhone());
			ps.setString(4, address.getPincode());
			ps.setString(5, address.getAddressLine1());
			ps.setString(6, address.getAddressLine2());
			ps.setString(7, address.getCity());
			ps.setString(8, address.getState());
			ps.setString(9, address.getLandmark());
			ps.setString(10, address.getAddressType());
			ps.setBoolean(11, address.getIsDefault() != null ? address.getIsDefault() : false);

			return ps;
		}, keyHolder);

		return keyHolder.getKey().longValue();
	}

	@Override
	public boolean update(Address address) {
		String sql = """
				    UPDATE addresses SET
				        full_name = ?, phone = ?, pincode = ?,
				        address_line1 = ?, address_line2 = ?,
				        city = ?, state = ?, landmark = ?,
				        address_type = ?, is_default = ?
				    WHERE id = ? AND user_id = ?
				""";

		return jdbcTemplate.update(sql, address.getFullName(), address.getPhone(), address.getPincode(),
				address.getAddressLine1(), address.getAddressLine2(), address.getCity(), address.getState(),
				address.getLandmark(), address.getAddressType(), address.getIsDefault(), address.getId(),
				address.getUserId()) > 0;
	}

	@Override
	public boolean deleteById(Long id, Long userId) {
		String sql = """
				    DELETE FROM addresses
				    WHERE id = ? AND user_id = ?
				""";

		return jdbcTemplate.update(sql, id, userId) > 0;
	}

	@Override
	public Optional<Address> findByIdAndUser(Long id, Long userId) {
		String sql = """
				    SELECT * FROM addresses
				    WHERE id = ? AND user_id = ?
				""";

		List<Address> list = jdbcTemplate.query(sql, new AddressRowMapper(), id, userId);

		return list.stream().findFirst();
	}

	@Override
	public List<Address> findAllByUser(Long userId) {
		String sql = """
				    SELECT * FROM addresses
				    WHERE user_id = ?
				    ORDER BY is_default DESC, id DESC
				""";

		return jdbcTemplate.query(sql, new AddressRowMapper(), userId);
	}

	@Override
	public boolean unsetAllDefaults(Long userId) {
		String sql = """
				    UPDATE addresses
				    SET is_default = FALSE
				    WHERE user_id = ?
				""";

		return jdbcTemplate.update(sql, userId) >= 0;
	}

	@Override
	public boolean setDefault(Long userId, Long addressId) {
		String sql = """
				    UPDATE addresses
				    SET is_default = TRUE
				    WHERE id = ? AND user_id = ?
				""";

		return jdbcTemplate.update(sql, addressId, userId) > 0;
	}

	@Override
	public boolean existsByIdAndUser(Long id, Long userId) {
		String sql = """
				    SELECT COUNT(*) FROM addresses
				    WHERE id = ? AND user_id = ?
				""";

		Integer count = jdbcTemplate.queryForObject(sql, Integer.class, id, userId);
		return count != null && count > 0;
	}

	@Override
	public int countByUser(Long userId) {
		String sql = """
				    SELECT COUNT(*) FROM addresses
				    WHERE user_id = ?
				""";

		Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId);
		return count != null ? count : 0;
	}
}