-- ============================================================
-- BARTER TRADE NAMIBIA - PRODUCTION DATABASE SETUP
-- ============================================================
-- This script sets up the complete production database schema
-- including all tables for the enterprise-grade platform.
-- Run this script once to initialize the database.
-- ============================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS barter_trade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barter_trade;

-- ==========================================
-- 1. USERS TABLE
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
    INDEX idx_id_verification_status (id_verification_status),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB;

-- ==========================================
-- 2. USER ONBOARDING TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_onboarding (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    personal_details_confirmed BOOLEAN DEFAULT FALSE,
    profile_picture_uploaded BOOLEAN DEFAULT FALSE,
    id_document_uploaded BOOLEAN DEFAULT FALSE,
    interests_selected BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    selected_interests JSON NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    last_prompt_at DATETIME NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_completed (onboarding_completed),
    CONSTRAINT fk_onboarding_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. USER INTERESTS TABLE (For Smart Matching)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_interests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NULL,
    interest_type ENUM('looking_for', 'willing_to_trade', 'general') DEFAULT 'general',
    keywords TEXT NULL,
    min_value DECIMAL(15, 2) NULL,
    max_value DECIMAL(15, 2) NULL,
    preferred_regions JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_category (category_id),
    INDEX idx_type (interest_type),
    INDEX idx_active (is_active),
    CONSTRAINT fk_interests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. SESSIONS TABLE
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
-- 5. CATEGORIES TABLE
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
    is_high_value BOOLEAN DEFAULT FALSE,
    min_high_value_threshold DECIMAL(15, 2) DEFAULT 50000.00,
    requires_documents BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_order (display_order),
    INDEX idx_high_value (is_high_value)
) ENGINE=InnoDB;

-- ==========================================
-- 6. SUBCATEGORIES TABLE
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
-- 7. LISTINGS TABLE
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
    is_high_value BOOLEAN DEFAULT FALSE,
    documents_required BOOLEAN DEFAULT FALSE,
    documents_verified BOOLEAN DEFAULT FALSE,
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
    INDEX idx_high_value (is_high_value),
    FULLTEXT idx_search (title, description)
) ENGINE=InnoDB;

-- ==========================================
-- 8. LISTING IMAGES TABLE
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
-- 9. LISTING DOCUMENTS TABLE (For High-Value Items)
-- ==========================================
CREATE TABLE IF NOT EXISTS listing_documents (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    document_type ENUM('ownership_proof', 'title_deed', 'registration', 'valuation', 'inspection', 'other') NOT NULL,
    document_name VARCHAR(200) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(36) NULL,
    verified_at DATETIME NULL,
    verification_notes TEXT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id),
    INDEX idx_listing (listing_id),
    INDEX idx_verified (is_verified)
) ENGINE=InnoDB;

-- ==========================================
-- 10. DOCUMENT REQUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS document_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    requester_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,
    document_types JSON NOT NULL,
    message TEXT NULL,
    status ENUM('pending', 'documents_uploaded', 'approved', 'rejected', 'expired') DEFAULT 'pending',
    response_message TEXT NULL,
    responded_at DATETIME NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_listing (listing_id),
    INDEX idx_requester (requester_id),
    INDEX idx_seller (seller_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- 11. LISTING LIKES TABLE
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
-- 12. LISTING SHARES TABLE
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
-- 13. LISTING VIEWS TABLE
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
-- 14. SAVED LISTINGS TABLE
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
-- 15. LISTING WANTED ITEMS TABLE
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
-- 16. TRANSACTIONS TABLE (Wallet)
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
-- 17. VOUCHERS TABLE
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
    INDEX idx_code (code),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- 18. CONVERSATIONS TABLE
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
-- 19. CONVERSATION PARTICIPANTS TABLE
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
-- 20. MESSAGES TABLE
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
-- 21. TRADE OFFERS TABLE
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
-- 22. TRADE OFFER ITEMS TABLE
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
-- 23. COMPLETED TRADES TABLE
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
-- 24. NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    type ENUM('trade', 'message', 'wallet', 'listing', 'system', 'match') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- 25. SMART MATCH NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS match_notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    match_type ENUM('interest_match', 'wanted_item_match', 'nearby', 'price_drop', 'new_listing') NOT NULL,
    match_score DECIMAL(5, 2) DEFAULT 0.00,
    match_reasons JSON NULL,
    is_seen BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_match (user_id, listing_id),
    INDEX idx_user (user_id),
    INDEX idx_listing (listing_id),
    INDEX idx_score (match_score),
    INDEX idx_seen (is_seen)
) ENGINE=InnoDB;

-- ==========================================
-- 26. COMMENTS TABLE
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
-- 27. COMMENT LIKES TABLE
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
-- 28. USER RATINGS TABLE
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
-- 29. REPORTS TABLE
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
-- 30. LISTING REPORTS TABLE
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
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- 31. USER REPORTS TABLE
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
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- 32. ID VERIFICATION REQUESTS TABLE
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
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- 33. ACTIVITY LOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    admin_id VARCHAR(36),
    type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id VARCHAR(36) NULL,
    description TEXT,
    old_values JSON,
    new_values JSON,
    details JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_admin (admin_id),
    INDEX idx_type (type),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- 34. WAITLIST TABLE
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
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- 35. ADVERTISEMENTS TABLE
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
    INDEX idx_position (position),
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB;

-- ==========================================
-- 36. TOP-UP REQUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS topup_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('mobile_money', 'bank_transfer', 'cash_deposit') DEFAULT 'mobile_money',
    bank VARCHAR(50),
    bank_name VARCHAR(100),
    provider VARCHAR(50),
    reference_number VARCHAR(100),
    receipt_url VARCHAR(500),
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    voucher_code VARCHAR(20),
    rejection_reason VARCHAR(255),
    notes TEXT,
    processed_by VARCHAR(36),
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- 37. ANALYTICS DAILY TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS analytics_daily (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    date DATE NOT NULL UNIQUE,
    new_users INT DEFAULT 0,
    active_users INT DEFAULT 0,
    new_listings INT DEFAULT 0,
    active_listings INT DEFAULT 0,
    total_trades INT DEFAULT 0,
    completed_trades INT DEFAULT 0,
    trade_volume DECIMAL(15, 2) DEFAULT 0.00,
    wallet_topups DECIMAL(15, 2) DEFAULT 0.00,
    wallet_transfers DECIMAL(15, 2) DEFAULT 0.00,
    vouchers_redeemed INT DEFAULT 0,
    page_views INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- ==========================================
-- 38. SYSTEM SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    is_editable BOOLEAN DEFAULT TRUE,
    updated_by VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_key (setting_key)
) ENGINE=InnoDB;

-- ==========================================
-- 39. ADMIN ALERTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_alerts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    type ENUM('warning', 'error', 'info', 'success') NOT NULL,
    category ENUM('security', 'system', 'user', 'listing', 'payment', 'report') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(36),
    resolved_at DATETIME,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_read (is_read)
) ENGINE=InnoDB;

-- ==========================================
-- INSERT DEFAULT CATEGORIES (with high-value flags)
-- ==========================================
INSERT IGNORE INTO categories (id, name, slug, icon, color, description, display_order, is_high_value, min_high_value_threshold, requires_documents) VALUES
(UUID(), 'Electronics', 'electronics', 'Smartphone', '#3b82f6', 'Phones, computers, TVs, and more', 1, FALSE, 50000.00, FALSE),
(UUID(), 'Vehicles', 'vehicles', 'Car', '#ef4444', 'Cars, trucks, motorcycles, and parts', 2, TRUE, 50000.00, TRUE),
(UUID(), 'Livestock', 'livestock', 'Beef', '#84cc16', 'Cattle, goats, sheep, poultry', 3, TRUE, 30000.00, FALSE),
(UUID(), 'Property', 'property', 'Home', '#f59e0b', 'Land, houses, and commercial property', 4, TRUE, 100000.00, TRUE),
(UUID(), 'Agriculture', 'agriculture', 'Wheat', '#22c55e', 'Farm equipment, seeds, produce', 5, FALSE, 50000.00, FALSE),
(UUID(), 'Fashion', 'fashion', 'Shirt', '#ec4899', 'Clothing, shoes, accessories', 6, FALSE, 50000.00, FALSE),
(UUID(), 'Services', 'services', 'Wrench', '#8b5cf6', 'Professional and trade services', 7, FALSE, 50000.00, FALSE),
(UUID(), 'Home & Garden', 'home-garden', 'Sofa', '#14b8a6', 'Furniture, appliances, decor', 8, FALSE, 50000.00, FALSE),
(UUID(), 'Sports', 'sports', 'Dumbbell', '#06b6d4', 'Sports equipment and gear', 9, FALSE, 50000.00, FALSE),
(UUID(), 'Collectibles', 'collectibles', 'Gem', '#6366f1', 'Art, antiques, rare items', 10, TRUE, 20000.00, FALSE);

-- ==========================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- ==========================================
INSERT IGNORE INTO system_settings (id, setting_key, setting_value, setting_type, category, description) VALUES
(UUID(), 'site_name', 'Barter Trade Namibia', 'string', 'general', 'Platform name'),
(UUID(), 'site_tagline', 'Trade Smart. Live Better.', 'string', 'general', 'Platform tagline'),
(UUID(), 'maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode'),
(UUID(), 'registration_enabled', 'true', 'boolean', 'general', 'Allow new user registrations'),
(UUID(), 'listing_require_approval', 'false', 'boolean', 'listings', 'Require admin approval for new listings'),
(UUID(), 'listing_max_images', '10', 'number', 'listings', 'Maximum images per listing'),
(UUID(), 'listing_max_value', '5000000', 'number', 'listings', 'Maximum listing value in NAD'),
(UUID(), 'high_value_threshold', '50000', 'number', 'listings', 'Value threshold for high-value listings'),
(UUID(), 'wallet_min_topup', '10', 'number', 'wallet', 'Minimum top-up amount'),
(UUID(), 'wallet_max_topup', '50000', 'number', 'wallet', 'Maximum top-up amount'),
(UUID(), 'wallet_transfer_fee_percent', '2.5', 'number', 'wallet', 'Transfer fee percentage'),
(UUID(), 'wallet_min_transfer', '5', 'number', 'wallet', 'Minimum transfer amount'),
(UUID(), 'trade_offer_expiry_days', '7', 'number', 'trades', 'Days until trade offer expires'),
(UUID(), 'document_request_expiry_days', '14', 'number', 'documents', 'Days until document request expires'),
(UUID(), 'smart_matching_enabled', 'true', 'boolean', 'matching', 'Enable smart matching notifications'),
(UUID(), 'match_radius_km', '100', 'number', 'matching', 'Default radius for nearby matching in km'),
(UUID(), 'email_notifications_enabled', 'true', 'boolean', 'notifications', 'Enable email notifications'),
(UUID(), 'sms_notifications_enabled', 'false', 'boolean', 'notifications', 'Enable SMS notifications'),
(UUID(), 'max_login_attempts', '5', 'number', 'security', 'Max failed login attempts'),
(UUID(), 'session_timeout_hours', '168', 'number', 'security', 'Session timeout in hours');

-- ==========================================
-- CREATE ADMIN USER (password: admin123)
-- ==========================================
INSERT IGNORE INTO users (id, email, password_hash, name, phone, gender, region, role, wallet_balance, is_verified, id_verification_status) VALUES
('admin-001', 'admin@bartertrade.na', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKxcg/wVDZQfMti', 'System Admin', '+264 61 123 4567', 'male', 'Khomas', 'admin', 50000.00, TRUE, 'approved');

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT 'Barter Trade Namibia PRODUCTION database setup completed!' AS status,
       (SELECT COUNT(*) FROM users) AS total_users,
       (SELECT COUNT(*) FROM categories) AS total_categories,
       (SELECT COUNT(*) FROM system_settings) AS total_settings;
