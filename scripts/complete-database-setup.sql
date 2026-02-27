-- Barter Trade Namibia - Complete Database Setup Script
-- This script creates ALL tables and is safe to run multiple times (uses IF NOT EXISTS)
-- For cPanel MySQL deployment
-- 
-- Run this script to set up the complete database schema
-- Database: barter_trade

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS barter_trade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barter_trade;

-- ==========================================
-- USERS TABLE (with all production fields)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    gender ENUM('male', 'female', 'other') NULL,
    date_of_birth DATE NULL,
    region VARCHAR(50) NOT NULL,
    town VARCHAR(100),
    street_address VARCHAR(255) NULL,
    postal_code VARCHAR(20) NULL,
    avatar VARCHAR(500),
    role ENUM('user', 'admin') DEFAULT 'user',
    wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason VARCHAR(255),
    -- ID Verification fields
    national_id_front VARCHAR(500) NULL,
    national_id_back VARCHAR(500) NULL,
    id_verification_status ENUM('not_submitted', 'pending', 'approved', 'rejected') DEFAULT 'not_submitted',
    id_rejection_reason VARCHAR(255) NULL,
    id_verified_at DATETIME NULL,
    id_verified_by VARCHAR(36) NULL,
    -- Auth tokens
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    -- Timestamps
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_region (region),
    INDEX idx_role (role),
    INDEX idx_id_verification_status (id_verification_status),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB;

-- ==========================================
-- SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- ==========================================
-- CATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#ea580c',
    description VARCHAR(255),
    image VARCHAR(500),
    listing_count INT DEFAULT 0,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_order (display_order)
) ENGINE=InnoDB;

-- ==========================================
-- SUBCATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS subcategories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_subcat (category_id, slug),
    INDEX idx_category (category_id)
) ENGINE=InnoDB;

-- ==========================================
-- LISTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS listings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category_id VARCHAR(36) NOT NULL,
    subcategory_id VARCHAR(36),
    type ENUM('item', 'service') DEFAULT 'item',
    value DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NAD',
    `condition` ENUM('new', 'like_new', 'good', 'fair', 'poor') DEFAULT 'good',
    region VARCHAR(50) NOT NULL,
    town VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status ENUM('pending', 'active', 'sold', 'flagged', 'expired', 'draft') DEFAULT 'pending',
    views INT DEFAULT 0,
    saves INT DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    featured_until DATETIME,
    trade_preferences TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    INDEX idx_user (user_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_region (region),
    INDEX idx_featured (featured),
    INDEX idx_created (created_at),
    FULLTEXT idx_search (title, description)
) ENGINE=InnoDB;

-- ==========================================
-- LISTING IMAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS listing_images (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    INDEX idx_listing (listing_id)
) ENGINE=InnoDB;

-- ==========================================
-- LISTING LIKES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS listing_likes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (user_id, listing_id),
    INDEX idx_listing (listing_id)
) ENGINE=InnoDB;

-- ==========================================
-- LISTING SHARES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS listing_shares (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    listing_id VARCHAR(36) NOT NULL,
    platform ENUM('copy', 'whatsapp', 'facebook', 'twitter', 'email', 'other') DEFAULT 'other',
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    INDEX idx_listing (listing_id)
) ENGINE=InnoDB;

-- ==========================================
-- LISTING VIEWS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS listing_views (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    listing_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    referrer VARCHAR(500),
    session_id VARCHAR(100),
    duration_seconds INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    INDEX idx_listing (listing_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- SAVED LISTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS saved_listings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_save (user_id, listing_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ==========================================
-- LISTING WANTED ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS listing_wanted_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category_id VARCHAR(36),
    estimated_value DECIMAL(15, 2),
    is_flexible BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_listing (listing_id)
) ENGINE=InnoDB;

-- ==========================================
-- TRANSACTIONS TABLE (Wallet)
-- ==========================================
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    type ENUM('topup', 'transfer_in', 'transfer_out', 'listing_fee', 'voucher', 'trade', 'refund') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(15, 2) DEFAULT 0.00,
    balance_after DECIMAL(15, 2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    reference VARCHAR(100),
    description VARCHAR(255),
    related_user_id VARCHAR(36),
    related_listing_id VARCHAR(36),
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- VOUCHERS TABLE (Production Schema)
-- Supports scratch card vouchers for vendors
-- Fixed denominations: 10, 20, 50, 100, 200
-- ==========================================
CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(10) NOT NULL UNIQUE,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('scratch', 'online') NOT NULL DEFAULT 'scratch',
    status ENUM('unused', 'used', 'disabled', 'expired') DEFAULT 'unused',
    vendor VARCHAR(255) NULL,
    batch_id VARCHAR(36) NULL,
    created_by VARCHAR(36) NOT NULL,
    used_by VARCHAR(36) NULL,
    used_by_phone VARCHAR(20) NULL,
    used_at DATETIME NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_vendor (vendor),
    INDEX idx_batch_id (batch_id),
    INDEX idx_used_by (used_by),
    INDEX idx_used_by_phone (used_by_phone),
    INDEX idx_expires (expires_at),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB;

-- ==========================================
-- CONVERSATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    listing_id VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
    INDEX idx_updated (updated_at)
) ENGINE=InnoDB;

-- ==========================================
-- CONVERSATION PARTICIPANTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS conversation_participants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    last_read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (conversation_id, user_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ==========================================
-- MESSAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('text', 'image', 'offer', 'system') DEFAULT 'text',
    offer_id VARCHAR(36),
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- TRADE OFFERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS trade_offers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36) NOT NULL,
    conversation_id VARCHAR(36),
    wallet_amount DECIMAL(15, 2) DEFAULT 0.00,
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'countered', 'expired', 'cancelled') DEFAULT 'pending',
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- TRADE OFFER ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS trade_offer_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    offer_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    side ENUM('sender', 'receiver') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offer_id) REFERENCES trade_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    INDEX idx_offer (offer_id)
) ENGINE=InnoDB;

-- ==========================================
-- COMPLETED TRADES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS completed_trades (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    offer_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,
    buyer_id VARCHAR(36) NOT NULL,
    wallet_amount DECIMAL(15, 2) DEFAULT 0.00,
    notes TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offer_id) REFERENCES trade_offers(id),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    INDEX idx_seller (seller_id),
    INDEX idx_buyer (buyer_id),
    INDEX idx_completed (completed_at)
) ENGINE=InnoDB;

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    type ENUM('trade', 'message', 'wallet', 'listing', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- COMMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    parent_id VARCHAR(36),
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_listing (listing_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- COMMENT LIKES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS comment_likes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    comment_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_comment_like (user_id, comment_id),
    INDEX idx_comment (comment_id)
) ENGINE=InnoDB;

-- ==========================================
-- USER RATINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_ratings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    from_user_id VARCHAR(36) NOT NULL,
    to_user_id VARCHAR(36) NOT NULL,
    trade_offer_id VARCHAR(36),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trade_offer_id) REFERENCES trade_offers(id) ON DELETE SET NULL,
    UNIQUE KEY unique_rating (from_user_id, trade_offer_id),
    INDEX idx_to_user (to_user_id)
) ENGINE=InnoDB;

-- ==========================================
-- REPORTS TABLE (General)
-- ==========================================
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reporter_id VARCHAR(36) NOT NULL,
    reported_type ENUM('listing', 'user', 'message') NOT NULL,
    reported_id VARCHAR(36) NOT NULL,
    reason ENUM('spam', 'fraud', 'inappropriate', 'counterfeit', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    reviewed_by VARCHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_type (reported_type)
) ENGINE=InnoDB;

-- ==========================================
-- LISTING REPORTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS listing_reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    reporter_id VARCHAR(36) NOT NULL,
    reason ENUM('spam', 'fraud', 'inappropriate', 'counterfeit', 'wrong_category', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by VARCHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_listing (listing_id),
    INDEX idx_reporter (reporter_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- USER REPORTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reported_user_id VARCHAR(36) NOT NULL,
    reporter_id VARCHAR(36) NOT NULL,
    reason ENUM('spam', 'fraud', 'harassment', 'fake_account', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by VARCHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_reported_user (reported_user_id),
    INDEX idx_reporter (reporter_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- ID VERIFICATION REQUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS id_verification_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    national_id_front VARCHAR(500) NOT NULL,
    national_id_back VARCHAR(500) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason VARCHAR(255),
    reviewed_by VARCHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- ACTIVITY LOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    details JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- USER SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    
    -- Notification settings
    notification_email TINYINT(1) DEFAULT 1,
    notification_push TINYINT(1) DEFAULT 1,
    notification_new_offers TINYINT(1) DEFAULT 1,
    notification_messages TINYINT(1) DEFAULT 1,
    notification_price_drops TINYINT(1) DEFAULT 0,
    notification_weekly_digest TINYINT(1) DEFAULT 1,
    
    -- Privacy settings
    privacy_show_online_status TINYINT(1) DEFAULT 1,
    privacy_show_location TINYINT(1) DEFAULT 1,
    privacy_allow_messages TINYINT(1) DEFAULT 1,
    
    -- Appearance settings
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id),
    INDEX idx_user_settings_user (user_id)
) ENGINE=InnoDB;

-- ==========================================
-- WAITLIST TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS waitlist (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    phone VARCHAR(20),
    region VARCHAR(50),
    referral_code VARCHAR(20),
    status ENUM('pending', 'invited', 'registered') DEFAULT 'pending',
    invited_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- ADVERTISEMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS advertisements (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(500),
    cta_text VARCHAR(100) NOT NULL,
    cta_href VARCHAR(500) NOT NULL,
    image_url VARCHAR(500),
    gradient_colors VARCHAR(100) DEFAULT 'from-primary to-amber-500',
    position ENUM('home-banner', 'browse-sidebar', 'listing-detail', 'dashboard') DEFAULT 'home-banner',
    priority INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME,
    views INT DEFAULT 0,
    clicks INT DEFAULT 0,
    created_by VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_position (position),
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_priority (priority)
) ENGINE=InnoDB;

-- ==========================================
-- TOP-UP REQUESTS TABLE (Mobile Money)
-- ==========================================
CREATE TABLE IF NOT EXISTS topup_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    bank VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    receipt_url VARCHAR(500) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    voucher_code VARCHAR(20),
    rejection_reason VARCHAR(255),
    processed_by VARCHAR(36),
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- INSERT DEFAULT CATEGORIES
-- ==========================================
INSERT INTO categories (id, name, slug, icon, color, description, display_order, image) VALUES
(UUID(), 'Electronics', 'electronics', 'Smartphone', '#3b82f6', 'Phones, computers, TVs, and more', 1, '/categories/electronics.jpg'),
(UUID(), 'Vehicles', 'vehicles', 'Car', '#ef4444', 'Cars, trucks, motorcycles, and parts', 2, '/categories/vehicles.jpg'),
(UUID(), 'Livestock', 'livestock', 'Beef', '#84cc16', 'Cattle, goats, sheep, poultry', 3, '/categories/livestock.jpg'),
(UUID(), 'Property', 'property', 'Home', '#f59e0b', 'Land, houses, and commercial property', 4, '/categories/property.jpg'),
(UUID(), 'Agriculture', 'agriculture', 'Wheat', '#22c55e', 'Farm equipment, seeds, produce', 5, '/categories/agriculture.jpg'),
(UUID(), 'Fashion', 'fashion', 'Shirt', '#ec4899', 'Clothing, shoes, accessories', 6, '/categories/fashion.jpg'),
(UUID(), 'Services', 'services', 'Wrench', '#8b5cf6', 'Professional and trade services', 7, '/categories/services.jpg'),
(UUID(), 'Home & Garden', 'home-garden', 'Sofa', '#14b8a6', 'Furniture, appliances, decor', 8, '/categories/home.jpg')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ==========================================
-- INSERT DEMO ADMIN USER (password: admin123)
-- ==========================================
-- Note: Password hash for "admin123" using bcrypt
INSERT INTO users (id, email, password_hash, name, phone, gender, region, role, wallet_balance, is_verified, id_verification_status) VALUES
('admin-001', 'admin@bartertrade.na', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKxcg/wVDZQfMti', 'System Admin', '+264 61 123 4567', 'male', 'Khomas', 'admin', 50000.00, TRUE, 'approved')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- ==========================================
-- INSERT DEMO VOUCHERS (10-digit NUMERIC codes only)
-- Status uses 'unused' as defined in the ENUM: 'unused', 'used', 'disabled', 'expired'
-- In production, use the CreateVouchers stored procedure instead
-- ==========================================
INSERT INTO vouchers (id, code, amount, type, status, created_by, expires_at) VALUES
-- N$10 denomination demo vouchers
(UUID(), '1000000001', 10.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '1000000002', 10.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '1000000003', 10.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
-- N$20 denomination demo vouchers
(UUID(), '2000000001', 20.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '2000000002', 20.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '2000000003', 20.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
-- N$50 denomination demo vouchers
(UUID(), '5000000001', 50.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '5000000002', 50.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '5000000003', 50.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
-- N$100 denomination demo vouchers
(UUID(), '1000000101', 100.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '1000000102', 100.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '1000000103', 100.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
-- N$200 denomination demo vouchers
(UUID(), '2000000201', 200.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '2000000202', 200.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
-- N$500 denomination demo vouchers
(UUID(), '5000000501', 500.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '5000000502', 500.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
-- N$1000 denomination demo vouchers
(UUID(), '1000001001', 1000.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY)),
(UUID(), '1000001002', 1000.00, 'scratch', 'unused', 'admin-001', DATE_ADD(NOW(), INTERVAL 365 DAY))
ON DUPLICATE KEY UPDATE code = VALUES(code);

-- ==========================================
-- GRANT PERMISSIONS (for cPanel)
-- ==========================================
-- Note: Update 'your_cpanel_user' with your actual cPanel MySQL username
-- GRANT ALL PRIVILEGES ON barter_trade.* TO 'your_cpanel_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT 'Barter Trade Namibia database setup completed successfully!' AS status;
