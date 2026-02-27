-- Barter Trade Namibia - MySQL Database Schema
-- Database: barter_trade
-- Run this script to set up all required tables

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS barter_trade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barter_trade;

-- ==========================================
-- Users Table
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    region VARCHAR(50) NOT NULL,
    town VARCHAR(100),
    avatar VARCHAR(500),
    role ENUM('user', 'admin') DEFAULT 'user',
    wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason VARCHAR(255),
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_region (region),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ==========================================
-- Sessions Table (for secure authentication)
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
-- Categories Table
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
-- Subcategories Table
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
-- Listings Table
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
-- Listing Images Table
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
-- Saved Listings Table
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
-- Transactions Table (Wallet)
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
-- Vouchers Table
-- ==========================================
CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(20) NOT NULL UNIQUE,
    amount DECIMAL(15, 2) NOT NULL,
    status ENUM('available', 'redeemed', 'expired', 'cancelled') DEFAULT 'available',
    created_by VARCHAR(36) NOT NULL,
    redeemed_by VARCHAR(36),
    redeemed_at DATETIME,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (redeemed_by) REFERENCES users(id),
    INDEX idx_code (code),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- Conversations Table
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
-- Conversation Participants Table
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
-- Messages Table
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
-- Trade Offers Table
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
-- Trade Offer Items Table
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
-- Notifications Table
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
-- Comments Table (for listing comments)
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
-- Listing Wanted Items Table (What user wants in exchange)
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
-- User Ratings Table
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
-- Completed Trades Table (Trade History)
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
-- Reports Table (for flagged content)
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
-- Activity Log Table
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
INSERT INTO users (id, email, password_hash, name, phone, region, role, wallet_balance, is_verified) VALUES
('admin-001', 'admin@bartertrade.na', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKxcg/wVDZQfMti', 'System Admin', '+264 61 123 4567', 'Khomas', 'admin', 50000.00, TRUE)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- ==========================================
-- INSERT DEMO USERS (password: demo1234)
-- ==========================================
INSERT INTO users (id, email, password_hash, name, phone, region, town, avatar, wallet_balance, is_verified) VALUES
('user-001', 'maria@example.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria Shikongo', '+264 81 234 5678', 'Khomas', 'Windhoek', '/avatars/maria.jpg', 2500.00, TRUE),
('user-002', 'peter@example.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Peter Kahuika', '+264 81 345 6789', 'Erongo', 'Swakopmund', '/avatars/peter.jpg', 1800.00, TRUE),
('user-003', 'anna@example.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Anna Nghipondoka', '+264 81 456 7890', 'Oshana', 'Oshakati', '/avatars/anna.jpg', 3200.00, TRUE),
('user-004', 'thomas@example.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thomas Shihepo', '+264 81 567 8901', 'Otjozondjupa', 'Otjiwarongo', '/avatars/thomas.jpg', 4500.00, TRUE),
('user-005', 'grace@example.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Grace Amutenya', '+264 81 678 9012', 'Omusati', 'Outapi', '/avatars/grace.jpg', 1200.00, TRUE),
('user-006', 'joseph@example.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Joseph Mbumba', '+264 81 789 0123', 'Kavango East', 'Rundu', '/avatars/joseph.jpg', 5800.00, TRUE),
-- User: popyamobile@gmail.com, Password: freedom21 (bcrypt hash)
('user-007', 'popyamobile@gmail.com', '$2b$12$aN3Jz1yJqWvKV6vKpxqQx.bxSdG1fZr7H8qR5w2xY3pT9mN0vK4Ue', 'Popya Mobile', '+264 81 000 0001', 'Khomas', 'Windhoek', NULL, 1000.00, TRUE)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- ==========================================
-- INSERT DEMO VOUCHERS
-- ==========================================
INSERT INTO vouchers (id, code, amount, status, created_by, expires_at) VALUES
(UUID(), 'WELCOME50', 50.00, 'available', 'admin-001', DATE_ADD(NOW(), INTERVAL 30 DAY)),
(UUID(), 'TRADE100', 100.00, 'available', 'admin-001', DATE_ADD(NOW(), INTERVAL 30 DAY)),
(UUID(), 'BARTER200', 200.00, 'available', 'admin-001', DATE_ADD(NOW(), INTERVAL 30 DAY)),
(UUID(), 'NEWUSER25', 25.00, 'available', 'admin-001', DATE_ADD(NOW(), INTERVAL 60 DAY)),
(UUID(), 'NAMIBIA500', 500.00, 'available', 'admin-001', DATE_ADD(NOW(), INTERVAL 14 DAY))
ON DUPLICATE KEY UPDATE code = VALUES(code);

-- ==========================================
-- Listing Likes Table
-- ==========================================
CREATE TABLE IF NOT EXISTS listing_likes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (user_id, listing_id),
    INDEX idx_listing (listing_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ==========================================
-- Comment Likes Table
-- ==========================================
CREATE TABLE IF NOT EXISTS comment_likes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    comment_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_comment_like (user_id, comment_id),
    INDEX idx_comment (comment_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ==========================================
-- Listing Shares Table (Track share analytics)
-- ==========================================
CREATE TABLE IF NOT EXISTS listing_shares (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    listing_id VARCHAR(36) NOT NULL,
    platform ENUM('copy', 'whatsapp', 'facebook', 'twitter', 'email', 'other') DEFAULT 'copy',
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    INDEX idx_listing (listing_id),
    INDEX idx_user (user_id),
    INDEX idx_platform (platform),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- Listing Views Table (Detailed view tracking)
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
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- VIEWS FOR STATISTICS
-- ==========================================
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
    (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_users_week,
    (SELECT COUNT(*) FROM listings WHERE status = 'active') as active_listings,
    (SELECT COUNT(*) FROM listings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_listings_week,
    (SELECT COUNT(*) FROM trade_offers WHERE status = 'accepted') as completed_trades,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'topup' AND status = 'completed') as total_topups,
    (SELECT COUNT(*) FROM vouchers WHERE status = 'redeemed') as vouchers_redeemed;

CREATE OR REPLACE VIEW v_popular_categories AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.icon,
    c.color,
    c.image,
    COUNT(l.id) as listing_count
FROM categories c
LEFT JOIN listings l ON c.id = l.category_id AND l.status = 'active'
GROUP BY c.id
ORDER BY listing_count DESC;

-- Grant permissions
GRANT ALL PRIVILEGES ON barter_trade.* TO 'barter_trade'@'%';
FLUSH PRIVILEGES;
