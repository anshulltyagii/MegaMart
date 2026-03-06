/* ============================================================
   DATABASE: ecommerce_app  
   ============================================================ */

DROP DATABASE IF EXISTS ecommerce_app;
CREATE DATABASE ecommerce_app;
USE ecommerce_app;

/* ============================================================
   USERS TABLE
   Soft delete = account_status + no hard delete
   ============================================================ */
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('CUSTOMER','SHOPKEEPER','ADMIN') NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(12),
    account_status ENUM('ACTIVE','SUSPENDED','PENDING') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username,email,password_hash,role,full_name,phone,account_status)
VALUES
('anshul','anshul@gmail.com','anshul123','CUSTOMER','Anshul Tyagi','9876543210','ACTIVE'),
('shopvanshika','vanshika@gmail.com','vanshika123','SHOPKEEPER','Vanshika Sharma','9998887770','ACTIVE'),
('snigdhaadmin','snigdha@gmail.com','admin123','ADMIN','Snigdha Admin','9876501234','ACTIVE');


/* ============================================================
   SHOPS TABLE
   Soft delete = is_active
   ============================================================ */
CREATE TABLE shops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_user_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    address TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

INSERT INTO shops (owner_user_id,name,description,address,is_approved,is_active)
VALUES (2,'Vanshika Fashion','Trendy clothes','Delhi, India',TRUE,TRUE);


/* ============================================================
   CATEGORIES
   Soft delete = is_active
   ============================================================ */
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_category_id BIGINT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id)
);

INSERT INTO categories (name,slug,is_active)
VALUES
('Fashion','fashion',TRUE),
('Women Clothing','women-clothing',TRUE),
('Men Clothing','men-clothing',TRUE);


/* ============================================================
   PRODUCTS
   Soft delete = is_active
   ============================================================ */
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT NOT NULL,
    category_id BIGINT,
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(150) NOT NULL,
    short_description VARCHAR(200),
    description TEXT,
    selling_price DECIMAL(12,2) NOT NULL,
    mrp DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

INSERT INTO products (shop_id,category_id,sku,name,short_description,description,selling_price,mrp,is_active)
VALUES
(1,2,'TSHIRT001','Women Yellow T-Shirt','Comfort fit','High-quality cotton',499,799,TRUE);


/* ============================================================
   PRODUCT IMAGES 
   Soft delete = is_deleted
   ============================================================ */
CREATE TABLE product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_image_order INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO product_images (product_id,image_path,is_primary)
VALUES (1,'/images/tshirt1.png',TRUE);


/* ============================================================
   INVENTORY 
   ============================================================ */
CREATE TABLE inventory (
    product_id BIGINT PRIMARY KEY,
    quantity INT NOT NULL DEFAULT 0,
    reserved INT NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO inventory (product_id,quantity,reserved)
VALUES (1,50,0);


/* ============================================================
   VARIANT TABLES
   ============================================================ */
CREATE TABLE product_variant_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    group_name VARCHAR(30) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE product_variant_value (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    value_name VARCHAR(30) NOT NULL,
    FOREIGN KEY (group_id) REFERENCES product_variant_group(id)
);

CREATE TABLE product_variant_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    variant_value_id BIGINT NOT NULL,
    quantity INT DEFAULT 0,
    price_offset DECIMAL(12,2) DEFAULT 0.00,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_value_id) REFERENCES product_variant_value(id)
);


/* ============================================================
   ADDRESSES
   ============================================================ */
CREATE TABLE addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(12),
    pincode VARCHAR(6),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(50),
    state VARCHAR(50),
    landmark VARCHAR(150),
    address_type VARCHAR(20) DEFAULT 'HOME',
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO addresses (user_id,full_name,phone,pincode,address_line1,city,state,is_default)
VALUES (1,'Anshul','9876543210','110001','CP, Delhi','New Delhi','Delhi',TRUE);


/* ============================================================
   CART
   ============================================================ */
CREATE TABLE carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO carts (user_id) VALUES (1);


/* ============================================================
   CART ITEMS
   ============================================================ */
CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price_at_add DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES carts(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);


/* ============================================================
   ORDERS (never delete)
   ============================================================ */
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    shop_id BIGINT NOT NULL,
    order_number VARCHAR(50) UNIQUE,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('PLACED','CONFIRMED','SHIPPED','DELIVERED','CANCELLED','RETURNED') DEFAULT 'PLACED',
    payment_status ENUM('PENDING','PAID','FAILED','REFUNDED') DEFAULT 'PENDING',
    shipping_address TEXT,
    order_parent_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shop_id) REFERENCES shops(id)
);


/* ============================================================
   ORDER ITEMS
   ============================================================ */
CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);


/* ============================================================
   PAYMENTS
   ============================================================ */
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    method VARCHAR(30),
    status ENUM('INIT','SUCCESS','FAILED','REFUNDED'),
    txn_reference VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);


/* ============================================================
   REVIEWS (soft delete)
   ============================================================ */
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating TINYINT NOT NULL,
    title VARCHAR(150),
    body TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);


/* ============================================================
   WISHLIST
   ============================================================ */
CREATE TABLE wishlist_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id,product_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);


/* ============================================================
   RECENTLY VIEWED
   ============================================================ */
CREATE TABLE recently_viewed (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);


/* ============================================================
   COUPONS (soft delete via is_active)
   ============================================================ */
CREATE TABLE coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('PERCENT','FLAT'),
    discount_value DECIMAL(10,2),
    min_order_amount DECIMAL(12,2) DEFAULT 0,
    valid_from DATE,
    valid_to DATE,
    shop_id BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (shop_id) REFERENCES shops(id)
);

INSERT INTO coupons (code,discount_type,discount_value,min_order_amount,valid_from,valid_to,is_active)
VALUES ('NEW50','FLAT',50,200,'2024-01-01','2025-12-31',TRUE);


/* ============================================================
   COUPON USAGE
   ============================================================ */
CREATE TABLE coupon_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    coupon_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);


/* ============================================================
   RETURN REQUESTS
   ============================================================ */
CREATE TABLE return_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    reason TEXT,
    status ENUM('REQUESTED','APPROVED','REJECTED','REFUNDED') DEFAULT 'REQUESTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);


/* ============================================================
   EMAIL NOTIFICATIONS
   ============================================================ */
CREATE TABLE email_notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    subject VARCHAR(255),
    message TEXT,
    status ENUM('PENDING','SENT','FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


/* ============================================================
   OTP CODES
   ============================================================ */
CREATE TABLE otp_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(150) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


/* ============================================================
   ADMIN LOGS
   ============================================================ */
CREATE TABLE admin_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id BIGINT NOT NULL,
    action VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id)
);
