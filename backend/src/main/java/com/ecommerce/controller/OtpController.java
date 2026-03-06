package com.ecommerce.controller;

import com.ecommerce.dto.OtpRequest;
import com.ecommerce.dto.OtpVerifyRequest;
import com.ecommerce.service.OtpService;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

	private final OtpService otpService;

	public OtpController(OtpService otpService) {
		this.otpService = otpService;
	}

	@PostMapping("/generate")
	public ResponseEntity<String> generateOtp(@RequestBody OtpRequest request) {
		String msg = otpService.generateOtp(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(msg);
	}

	@PostMapping("/verify")
	public ResponseEntity<String> verifyOtp(@RequestBody OtpVerifyRequest request) {
		String msg = otpService.verifyOtp(request);
		return ResponseEntity.ok(msg);
	}
}