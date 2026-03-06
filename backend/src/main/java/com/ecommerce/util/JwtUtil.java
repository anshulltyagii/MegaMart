package com.ecommerce.util;

import com.ecommerce.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

	@Value("${jwt.secret}")
	private String jwtSecret;

	@Value("${jwt.expiration-ms}")
	private long jwtExpirationMs;

	private Key getSigningKey() {
		return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
	}

	public String generateToken(User user) {

	    return Jwts.builder()
	            .setSubject(String.valueOf(user.getId())) 
	            .claim("userId", user.getId())            
	            .claim("username", user.getUsername())
	            .claim("role", user.getRole().name())
	            .setIssuedAt(new Date())
	            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
	            .signWith(getSigningKey())
	            .compact();
	}


	public Long getUserId(String token) {
		Claims claims = Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();

		return Long.parseLong(claims.getSubject());
	}

	public boolean validate(String token) {
		try {
			Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
			return true;
		} catch (Exception ex) {
			return false;
		}
	}
}
