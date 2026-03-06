package com.ecommerce.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	private final JwtAuthInterceptor jwtAuthInterceptor;

	public WebConfig(JwtAuthInterceptor jwtAuthInterceptor) {
		this.jwtAuthInterceptor = jwtAuthInterceptor;
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {

		registry.addInterceptor(jwtAuthInterceptor)
		.addPathPatterns("/api/**")

				// PUBLIC ENDPOINTS 
				.excludePathPatterns(
						"/api/auth/reset-password", 
						"/api/auth/check-phone",
						"/api/auth/check-email",
						"/api/auth/check-username",
						"/api/auth/login",
						"/api/auth/register",
						"/api/otp/**", 
						"/api/public/**",

						//  allow all public product routes
						"/api/products", 
						"/api/products/",
						"/api/products/[0-9]*",
						"/api/products/*", 
						"/api/products/search/**",

						// Category browsing
						"/api/categories/**",
						"/api/products/*/images",
						"/api/products/*/images/**",
						"/api/reviews/avg/*",
						"/api/reviews/newest/*",
						"/api/reviews/highest/*",
						"/api/reviews/lowest/*",
						"/api/reviews/product/*"

);
		}


	@Override
	public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
		registry.addMapping("/**").allowedOrigins("http://localhost:3000")
				.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH").allowedHeaders("*")
				.allowCredentials(true);
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {

		registry.addResourceHandler("/product-images/**").addResourceLocations("file:product-images/");
	}
}
