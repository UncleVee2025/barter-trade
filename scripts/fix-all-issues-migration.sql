-- ============================================================
-- Barter Trade Namibia - Comprehensive Fix Migration Script
-- ============================================================
-- Run this script AFTER the master setup to fix all missing tables
-- and add new columns needed for full functionality
-- ============================================================

SET NAMES utf8mb4;

-- ============================================================
-- 1. USER ONBOARDING TABLE (Critical for onboarding flow)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_onboarding (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    personal_details_confirmed BOOLEAN DEFAULT FALSE,
    profile_picture_uploaded BOOLEAN DEFAULT FALSE,
    id_document_uploaded BOOLEAN DEFAULT FALSE,
    interests_selected BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    selected_interests JSON DEFAULT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    last_prompt_at DATETIME NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_completed (onboarding_completed),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. FIX VOUCHERS TABLE - Add missing columns
-- ============================================================
-- Add redeemed_by and redeemed_at columns if they don't exist
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS redeemed_by VARCHAR(36) NULL,
ADD COLUMN IF NOT EXISTS redeemed_at DATETIME NULL;

-- Add index for faster lookups
ALTER TABLE vouchers ADD INDEX IF NOT EXISTS idx_vendor (vendor);

-- ============================================================
-- 3. FIX ADVERTISEMENTS TABLE - Add missing columns for paid ads
-- ============================================================
ALTER TABLE advertisements 
ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER title,
ADD COLUMN IF NOT EXISTS ad_type ENUM('sponsored', 'paid') DEFAULT 'sponsored' AFTER position,
ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'scheduled', 'expired') DEFAULT 'active' AFTER ad_type,
ADD COLUMN IF NOT EXISTS impressions INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_name VARCHAR(200) NULL,
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS website VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS duration_type ENUM('daily', 'weekly', 'monthly') NULL,
ADD COLUMN IF NOT EXISTS duration_days INT NULL,
ADD COLUMN IF NOT EXISTS pricing_package VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'overdue', 'refunded') NULL,
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS quotation_sent_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS invoice_sent_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS reminder_sent_at DATETIME NULL;

-- Fix legacy columns that may have different names
ALTER TABLE advertisements 
CHANGE COLUMN IF EXISTS subtitle description TEXT NULL;

-- ============================================================
-- 4. FIX USERS TABLE - Ensure all columns exist
-- ============================================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT NULL AFTER avatar,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0;

-- ============================================================
-- 5. CREATE LISTING VIEWS TABLE (for accurate view tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS listing_views (
    id VARCHAR(36) PRIMARY KEY,
    listing_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_listing (listing_id),
    INDEX idx_user (user_id),
    INDEX idx_viewed (viewed_at),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. CREATE ADMIN SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(255),
    updated_by VARCHAR(36),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin settings
INSERT IGNORE INTO admin_settings (setting_key, setting_value, setting_type, description) VALUES
('platform_fee_percentage', '5', 'number', 'Platform fee percentage for transfers'),
('min_transfer_amount', '5', 'number', 'Minimum transfer amount in NAD'),
('max_transfer_amount', '10000', 'number', 'Maximum transfer amount in NAD'),
('min_topup_amount', '10', 'number', 'Minimum top-up amount in NAD'),
('max_topup_amount', '10000', 'number', 'Maximum top-up amount in NAD'),
('listing_fee_enabled', 'false', 'boolean', 'Whether to charge for listings'),
('listing_fee_amount', '0', 'number', 'Listing fee amount in NAD'),
('featured_listing_fee', '50', 'number', 'Fee to feature a listing'),
('voucher_expiry_days', '365', 'number', 'Default voucher expiry in days'),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
('welcome_message', 'Welcome to Barter Trade Namibia!', 'string', 'Welcome message for new users');

-- ============================================================
-- 7. CREATE DASHBOARD STATS VIEW
-- ============================================================
DROP VIEW IF EXISTS v_dashboard_stats;
CREATE VIEW v_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users,
    (SELECT COUNT(*) FROM listings WHERE status = 'active') AS active_listings,
    (SELECT COUNT(*) FROM trade_offers WHERE status = 'accepted') AS completed_trades,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'topup' AND status = 'completed') AS total_topups,
    (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS new_users_week,
    (SELECT COUNT(*) FROM listings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS new_listings_week,
    (SELECT COUNT(*) FROM users WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)) AS online_users,
    (SELECT COUNT(*) FROM vouchers WHERE status = 'unused') AS unused_vouchers,
    (SELECT COALESCE(SUM(amount), 0) FROM vouchers WHERE status = 'unused') AS voucher_total_value;

-- ============================================================
-- 8. CREATE INDEX FOR BETTER PERFORMANCE
-- ============================================================
-- These will only create if they don't exist (silently fail if exists)
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vouchers_status_code ON vouchers(status, code);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- ============================================================
-- 9. ADD SAMPLE SPONSORED ADS (for testing)
-- ============================================================
INSERT IGNORE INTO advertisements (id, title, description, cta_text, cta_href, image_url, gradient_colors, position, ad_type, status, priority) VALUES
('ad-001', 'Premium Livestock Auction', 'Join our weekly cattle auctions every Saturday', 'View Auctions', '/dashboard/browse?category=livestock', NULL, 'from-amber-500 to-orange-500', 'home-banner', 'sponsored', 'active', 100),
('ad-002', 'Verified Seller Program', 'Get verified and boost your sales by 300%', 'Get Verified', '/dashboard/profile', NULL, 'from-blue-500 to-cyan-500', 'home-banner', 'sponsored', 'active', 90),
('ad-003', 'Trade Safely', 'Use our escrow service for secure transactions', 'Learn More', '/help/escrow', NULL, 'from-emerald-500 to-teal-500', 'home-banner', 'sponsored', 'active', 80);

-- ============================================================
-- VERIFICATION COMPLETE
-- ============================================================
SELECT 'All fixes applied successfully!' AS status;
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()) AS total_tables,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM vouchers) AS total_vouchers,
    (SELECT COUNT(*) FROM categories) AS total_categories;
