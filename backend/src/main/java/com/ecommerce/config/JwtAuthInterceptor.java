package com.ecommerce.config;

import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.util.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class JwtAuthInterceptor implements HandlerInterceptor {

	private final JwtUtil jwtUtil;
	private final UserRepository userRepository;

	public JwtAuthInterceptor(JwtUtil jwtUtil, UserRepository userRepository) {
		this.jwtUtil = jwtUtil;
		this.userRepository = userRepository;
	}

	@Override
	public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws Exception {

		if (req.getMethod().equalsIgnoreCase("OPTIONS")) {
			return true;
		}

		String path = req.getRequestURI();

		// Public APIs (Allow login/register without token)
		if (path.equals("/api/auth/login") || path.equals("/api/auth/register")
				|| path.equals("/api/auth/reset-password") || path.equals("/api/auth/check-username")
				|| path.equals("/api/auth/check-email") || path.equals("/api/auth/check-phone")
				|| path.startsWith("/api/otp/") || path.startsWith("/api/public/")
				|| path.startsWith("/api/products/search")) {
			return true;
		}

		String header = req.getHeader("Authorization");

		if (header == null || !header.startsWith("Bearer ")) {
			res.setStatus(401);
			res.getWriter().write("Missing Authorization!");
			return false;
		}

		String token = header.substring(7);

		if (!jwtUtil.validate(token)) {
			res.setStatus(401);
			res.getWriter().write("Invalid or expired token!");
			return false;
		}

		Long userId = jwtUtil.getUserId(token);
		User user = userRepository.findById(userId).orElse(null);

		if (user == null) {
			res.setStatus(401);
			res.getWriter().write("User does not exist");
			return false;
		}
		if (user != null) {
			req.setAttribute("currentUser", user);
			req.setAttribute("currentUserId", user.getId());
		}
		return true;
	}
}