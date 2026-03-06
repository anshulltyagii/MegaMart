package com.ecommerce.repository;

import com.ecommerce.model.OtpCode;

import java.util.Optional;

public interface OtpCodeRepository {

	Long save(OtpCode otp);

	Optional<OtpCode> findLatestValidOtp(String identifier);

	boolean markOtpUsed(Long id);

	boolean deleteOldOtps(String identifier);
}