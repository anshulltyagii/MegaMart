package com.ecommerce.service;

import com.ecommerce.dto.OtpRequest;
import com.ecommerce.dto.OtpVerifyRequest;

public interface OtpService {

	String generateOtp(OtpRequest request);

	String verifyOtp(OtpVerifyRequest request);
}