package com.ecommerce.repository.impl;

import com.ecommerce.model.ReturnRequest;
import com.ecommerce.repository.ReturnRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class ReturnRepositoryImpl implements ReturnRepository {

	private static final Logger log = LoggerFactory.getLogger(ReturnRepositoryImpl.class);

	private final JdbcTemplate jdbc;

	public ReturnRepositoryImpl(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
		log.info("ReturnRepository initialized");
	}

	private final RowMapper<ReturnRequest> rowMapper = (rs, rowNum) -> {
		ReturnRequest rr = new ReturnRequest();
		rr.setId(rs.getLong("id"));
		rr.setOrderId(rs.getLong("order_id"));
		rr.setReason(rs.getString("reason"));
		rr.setStatus(rs.getString("status"));

		Timestamp ts = rs.getTimestamp("created_at");
		rr.setCreatedAt(ts != null ? ts.toLocalDateTime() : null);
		return rr;
	};

	@Override
	public ReturnRequest save(ReturnRequest req) {
		String sql = "INSERT INTO return_requests (order_id, reason, status, created_at) VALUES (?, ?, ?, ?)";
		KeyHolder keyHolder = new GeneratedKeyHolder();

		jdbc.update(connection -> {
			PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
			ps.setLong(1, req.getOrderId());
			ps.setString(2, req.getReason());
			ps.setString(3, req.getStatus() != null ? req.getStatus() : "REQUESTED");
			ps.setTimestamp(4, Timestamp.valueOf(req.getCreatedAt()));
			return ps;
		}, keyHolder);

		if (keyHolder.getKey() != null) {
			req.setId(keyHolder.getKey().longValue());
		}
		return req;
	}

	@Override
	public void update(ReturnRequest req) {
		String sql = "UPDATE return_requests SET status = ? WHERE id = ?";
		jdbc.update(sql, req.getStatus(), req.getId());
	}

	@Override
	public Optional<ReturnRequest> findById(Long id) {
		String sql = "SELECT * FROM return_requests WHERE id = ?";
		try {
			ReturnRequest res = jdbc.queryForObject(sql, rowMapper, id);
			return Optional.ofNullable(res);
		} catch (org.springframework.dao.EmptyResultDataAccessException e) {
			return Optional.empty();
		}
	}

	@Override
	public List<ReturnRequest> findByUserId(Long userId) {
		String sql = """
				    SELECT rr.* FROM return_requests rr
				    JOIN orders o ON rr.order_id = o.id
				    WHERE o.user_id = ?
				    ORDER BY rr.created_at DESC
				""";
		try {
			return jdbc.query(sql, rowMapper, userId);
		} catch (Exception e) {
			return Collections.emptyList();
		}
	}

	@Override
	public boolean existsByOrderId(Long orderId) {
		String sql = "SELECT COUNT(*) FROM return_requests WHERE order_id = ?";
		Integer count = jdbc.queryForObject(sql, Integer.class, orderId);
		return count != null && count > 0;
	}

	@Override
	public Optional<ReturnRequest> findByOrderId(Long orderId) {
		String sql = "SELECT * FROM return_requests WHERE order_id = ?";
		try {
			ReturnRequest res = jdbc.queryForObject(sql, rowMapper, orderId);
			return Optional.ofNullable(res);
		} catch (Exception e) {
			return Optional.empty();
		}
	}

	@Override
	public List<ReturnRequest> findAll() {
		return jdbc.query("SELECT * FROM return_requests ORDER BY created_at DESC", rowMapper);
	}
}