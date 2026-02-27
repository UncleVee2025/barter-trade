-- ============================================================
-- Barter Trade Namibia - Master MySQL Setup Script
-- ============================================================
-- For cPanel MySQL deployment
-- Run this single script to set up the COMPLETE database
-- 
-- Instructions:
-- 1. Log into cPanel > phpMyAdmin
-- 2. Select your database (barter_trade)
-- 3. Go to SQL tab
-- 4. Paste this entire script and execute
-- ============================================================

-- Set character encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Use the database (update if your database name is different)
-- CREATE DATABASE IF NOT EXISTS barter_trade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE barter_trade;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
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
    national_id_front VARCHAR(500) NULL,
    national_id_back VARCHAR(500) NULL,
    id_verification_status ENUM('not_submitted', 'pending', 'approved', 'rejected') DEFAULT 'not_submitted',
    id_rejection_reason VARCHAR(255) NULL,
    id_verified_at DATETIME NULL,
    id_verified_by VARCHAR(36) NULL,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_region (region),
    INDEX idx_role (role),
    INDEX idx_id_verification_status (id_verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token(255)),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. SUBCATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subcategories (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_subcat (category_id, slug),
    INDEX idx_category (category_id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. LISTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
    id VARCHAR(36) PRIMARY KEY,
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
    INDEX idx_user (user_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_region (region),
    INDEX idx_featured (featured),
    INDEX idx_created (created_at),
    FULLTEXT idx_search (title, description),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. LISTING IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS listing_images (
    id VARCHAR(36) PRIMARY KEY,
    listing_id VARCHAR(36) NOT NULL,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_listing (listing_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. LISTING LIKES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS listing_likes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (user_id, listing_id),
    INDEX idx_listing (listing_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. SAVED LISTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_listings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_save (user_id, listing_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. LISTING WANTED ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS listing_wanted_items (
    id VARCHAR(36) PRIMARY KEY,
    listing_id VARCHAR(36) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category_id VARCHAR(36),
    estimated_value DECIMAL(15, 2),
    is_flexible BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_listing (listing_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. TRANSACTIONS TABLE (Wallet)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
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
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. VOUCHERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('scratch', 'online') DEFAULT 'scratch',
    status ENUM('unused', 'used', 'disabled', 'expired') DEFAULT 'unused',
    vendor VARCHAR(100),
    batch_id VARCHAR(36),
    created_by VARCHAR(36) NOT NULL,
    used_by VARCHAR(36),
    used_by_phone VARCHAR(20),
    used_at DATETIME,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_batch (batch_id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (used_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. CONVERSATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY,
    listing_id VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_updated (updated_at),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. CONVERSATION PARTICIPANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    last_read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_participant (conversation_id, user_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('text', 'image', 'offer', 'system') DEFAULT 'text',
    offer_id VARCHAR(36),
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. TRADE OFFERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS trade_offers (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36) NOT NULL,
    conversation_id VARCHAR(36),
    listing_id VARCHAR(36),
    wallet_amount DECIMAL(15, 2) DEFAULT 0.00,
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'countered', 'expired', 'cancelled') DEFAULT 'pending',
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_status (status),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. TRADE OFFER ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS trade_offer_items (
    id VARCHAR(36) PRIMARY KEY,
    offer_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    side ENUM('sender', 'receiver') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_offer (offer_id),
    FOREIGN KEY (offer_id) REFERENCES trade_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. COMPLETED TRADES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS completed_trades (
    id VARCHAR(36) PRIMARY KEY,
    offer_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,
    buyer_id VARCHAR(36) NOT NULL,
    wallet_amount DECIMAL(15, 2) DEFAULT 0.00,
    notes TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_seller (seller_id),
    INDEX idx_buyer (buyer_id),
    INDEX idx_completed (completed_at),
    FOREIGN KEY (offer_id) REFERENCES trade_offers(id),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('trade', 'message', 'wallet', 'listing', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. COMMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY,
    listing_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    parent_id VARCHAR(36),
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_listing (listing_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. COMMENT LIKES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS comment_likes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    comment_id VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_comment_like (user_id, comment_id),
    INDEX idx_comment (comment_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. USER RATINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_ratings (
    id VARCHAR(36) PRIMARY KEY,
    from_user_id VARCHAR(36) NOT NULL,
    to_user_id VARCHAR(36) NOT NULL,
    trade_offer_id VARCHAR(36),
    rating INT NOT NULL,
    review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_rating (from_user_id, trade_offer_id),
    INDEX idx_to_user (to_user_id),
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trade_offer_id) REFERENCES trade_offers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    reporter_id VARCHAR(36) NOT NULL,
    reported_type ENUM('listing', 'user', 'message') NOT NULL,
    reported_id VARCHAR(36) NOT NULL,
    reason ENUM('spam', 'fraud', 'inappropriate', 'counterfeit', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    reviewed_by VARCHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_type (reported_type),
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. ID VERIFICATION REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS id_verification_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    national_id_front VARCHAR(500) NOT NULL,
    national_id_back VARCHAR(500) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason VARCHAR(255),
    reviewed_by VARCHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 24. ACTIVITY LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    details JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 25. WAITLIST TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS waitlist (
    id VARCHAR(36) PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 26. ADVERTISEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS advertisements (
    id VARCHAR(36) PRIMARY KEY,
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
    INDEX idx_position (position),
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_priority (priority),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 27. TOP-UP REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS topup_requests (
    id VARCHAR(36) PRIMARY KEY,
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
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 28. USER SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
    user_id VARCHAR(36) PRIMARY KEY,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_push BOOLEAN DEFAULT TRUE,
    notification_new_offers BOOLEAN DEFAULT TRUE,
    notification_messages BOOLEAN DEFAULT TRUE,
    notification_price_drops BOOLEAN DEFAULT FALSE,
    notification_weekly_digest BOOLEAN DEFAULT TRUE,
    privacy_show_online_status BOOLEAN DEFAULT TRUE,
    privacy_show_location BOOLEAN DEFAULT TRUE,
    privacy_allow_messages BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'en',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 29. GAMIFICATION - USER GAMIFICATION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_gamification (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    total_points INT DEFAULT 0,
    tier ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond') DEFAULT 'bronze',
    star_rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    profile_completion_percent INT DEFAULT 0,
    badges JSON DEFAULT ('[]'),
    achievements JSON DEFAULT ('[]'),
    points_history JSON DEFAULT ('[]'),
    verified_trader BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 30. BADGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    points_required INT DEFAULT 0,
    tier_required ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond') DEFAULT NULL,
    is_special BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 31. ACHIEVEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    requirement_type ENUM('trades', 'listings', 'points', 'days_active', 'reviews', 'referrals', 'special') NOT NULL,
    requirement_value INT NOT NULL,
    points_reward INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 32. USER ACHIEVEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    achievement_id VARCHAR(36) NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 33. USER REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_reviews (
    id VARCHAR(36) PRIMARY KEY,
    reviewer_id VARCHAR(36) NOT NULL,
    reviewed_user_id VARCHAR(36) NOT NULL,
    trade_offer_id VARCHAR(36),
    rating INT NOT NULL,
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trade_offer_id) REFERENCES trade_offers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 34. POINT TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS point_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    points INT NOT NULL,
    action_type ENUM(
        'profile_complete',
        'email_verified',
        'phone_verified',
        'id_verified',
        'first_listing',
        'listing_approved',
        'first_trade',
        'trade_completed',
        'review_received',
        'streak_bonus',
        'referral_bonus',
        'special_achievement',
        'admin_bonus',
        'admin_deduct'
    ) NOT NULL,
    description VARCHAR(255),
    balance_after INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INSERT DEFAULT DATA
-- ============================================================

-- Insert categories
INSERT IGNORE INTO categories (id, name, slug, icon, color, description, display_order, image) VALUES
('cat-001', 'Electronics', 'electronics', 'Smartphone', '#3b82f6', 'Phones, computers, TVs, and more', 1, '/categories/electronics.jpg'),
('cat-002', 'Vehicles', 'vehicles', 'Car', '#ef4444', 'Cars, trucks, motorcycles, and parts', 2, '/categories/vehicles.jpg'),
('cat-003', 'Livestock', 'livestock', 'Beef', '#84cc16', 'Cattle, goats, sheep, poultry', 3, '/categories/livestock.jpg'),
('cat-004', 'Property', 'property', 'Home', '#f59e0b', 'Land, houses, and commercial property', 4, '/categories/property.jpg'),
('cat-005', 'Agriculture', 'agriculture', 'Wheat', '#22c55e', 'Farm equipment, seeds, produce', 5, '/categories/agriculture.jpg'),
('cat-006', 'Fashion', 'fashion', 'Shirt', '#ec4899', 'Clothing, shoes, accessories', 6, '/categories/fashion.jpg'),
('cat-007', 'Services', 'services', 'Wrench', '#8b5cf6', 'Professional and trade services', 7, '/categories/services.jpg'),
('cat-008', 'Home & Garden', 'home-garden', 'Sofa', '#14b8a6', 'Furniture, appliances, decor', 8, '/categories/home.jpg'),
('cat-009', 'Sports', 'sports', 'Dumbbell', '#06B6D4', 'Equipment, gear, fitness', 9, '/categories/sports.jpg');

-- Insert admin user (password: admin123)
-- IMPORTANT: Change this password immediately after first login!
-- Hash generated with bcrypt for "admin123"
INSERT IGNORE INTO users (id, email, password_hash, name, phone, gender, region, role, wallet_balance, is_verified, id_verification_status) VALUES
('admin-001', 'admin@bartertrade.na', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKxcg/wVDZQfMti', 'System Admin', '+264 61 123 4567', 'male', 'Khomas', 'admin', 0.00, TRUE, 'approved');

-- NOTE: No demo vouchers inserted - Admin generates vouchers via the dashboard
-- Navigate to Admin Dashboard > Voucher Management > Generate Vouchers

-- Insert badges
INSERT IGNORE INTO badges (id, name, slug, description, icon, color, points_required, tier_required, is_special) VALUES
('badge-001', 'First Steps', 'first-steps', 'Complete your profile', 'User', '#3B82F6', 0, NULL, FALSE),
('badge-002', 'Verified Trader', 'verified-trader', 'Complete ID verification', 'Shield', '#10B981', 0, NULL, FALSE),
('badge-003', 'Early Bird', 'early-bird', 'One of the first 1000 users', 'Sparkles', '#F59E0B', 0, NULL, TRUE),
('badge-004', 'Top Trader', 'top-trader', 'Complete 50 successful trades', 'Trophy', '#8B5CF6', 0, NULL, FALSE),
('badge-005', 'Community Helper', 'community-helper', 'Help 10 new users', 'Heart', '#EC4899', 0, NULL, FALSE),
('badge-006', 'Silver Status', 'silver-status', 'Reach Silver tier', 'Medal', '#94A3B8', 0, 'silver', FALSE),
('badge-007', 'Gold Status', 'gold-status', 'Reach Gold tier', 'Medal', '#F59E0B', 0, 'gold', FALSE),
('badge-008', 'Platinum Elite', 'platinum-elite', 'Reach Platinum tier', 'Crown', '#E5E4E2', 0, 'platinum', FALSE),
('badge-009', 'Diamond Legend', 'diamond-legend', 'Reach Diamond tier', 'Diamond', '#60A5FA', 0, 'diamond', FALSE),
('badge-010', 'Power Seller', 'power-seller', 'List 100 items', 'Rocket', '#F97316', 0, NULL, FALSE);

-- Insert achievements
INSERT IGNORE INTO achievements (id, name, slug, description, icon, color, requirement_type, requirement_value, points_reward) VALUES
('ach-001', 'Welcome Aboard', 'welcome', 'Join Barter Trade Namibia', 'PartyPopper', '#3B82F6', 'special', 1, 10),
('ach-002', 'Profile Pro', 'profile-complete', 'Complete your profile 100%', 'UserCheck', '#10B981', 'special', 1, 25),
('ach-003', 'First Trade', 'first-trade', 'Complete your first trade', 'Handshake', '#8B5CF6', 'trades', 1, 20),
('ach-004', 'Trader Rising', 'trader-5', 'Complete 5 trades', 'TrendingUp', '#F59E0B', 'trades', 5, 50),
('ach-005', 'Master Trader', 'trader-25', 'Complete 25 trades', 'Award', '#EC4899', 'trades', 25, 100),
('ach-006', 'Legend Trader', 'trader-100', 'Complete 100 trades', 'Trophy', '#EF4444', 'trades', 100, 250),
('ach-007', 'First Listing', 'first-listing', 'Create your first listing', 'Package', '#3B82F6', 'listings', 1, 10),
('ach-008', 'Active Seller', 'seller-10', 'Create 10 listings', 'Store', '#10B981', 'listings', 10, 50),
('ach-009', 'Super Seller', 'seller-50', 'Create 50 listings', 'Rocket', '#F97316', 'listings', 50, 150),
('ach-010', 'Five Stars', 'five-star', 'Receive a 5-star review', 'Star', '#F59E0B', 'reviews', 1, 15);

-- ============================================================
-- DONE!
-- ============================================================
SELECT 'Barter Trade Namibia database setup COMPLETE!' AS status;
SELECT CONCAT('Tables created: ', COUNT(*)) AS info FROM information_schema.tables WHERE table_schema = DATABASE();
