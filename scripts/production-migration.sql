-- Barter Trade Namibia - Production Migration Script
-- Run this script to add missing fields for production readiness

USE barter_trade;

-- ==========================================
-- ADD GENDER, ID VERIFICATION, AND ADDRESS FIELDS TO USERS TABLE
-- ==========================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'other') NULL AFTER phone,
ADD COLUMN IF NOT EXISTS date_of_birth DATE NULL AFTER gender,
ADD COLUMN IF NOT EXISTS street_address VARCHAR(255) NULL AFTER town,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) NULL AFTER street_address,
ADD COLUMN IF NOT EXISTS national_id_front VARCHAR(500) NULL AFTER postal_code,
ADD COLUMN IF NOT EXISTS national_id_back VARCHAR(500) NULL AFTER national_id_front,
ADD COLUMN IF NOT EXISTS id_verification_status ENUM('pending', 'approved', 'rejected', 'not_submitted') DEFAULT 'not_submitted' AFTER national_id_back,
ADD COLUMN IF NOT EXISTS id_rejection_reason VARCHAR(255) NULL AFTER id_verification_status,
ADD COLUMN IF NOT EXISTS id_verified_at DATETIME NULL AFTER id_rejection_reason,
ADD COLUMN IF NOT EXISTS id_verified_by VARCHAR(36) NULL AFTER id_verified_at;

-- Add index for verification status
CREATE INDEX IF NOT EXISTS idx_id_verification_status ON users(id_verification_status);

-- ==========================================
-- CREATE LISTING REPORTS TABLE IF NOT EXISTS
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
-- CREATE USER REPORTS TABLE IF NOT EXISTS
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
-- CREATE ID VERIFICATION REQUESTS TABLE
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
-- UPDATE EXISTING DEMO DATA (Add gender to demo users)
-- ==========================================
UPDATE users SET gender = 'female' WHERE email IN ('maria@example.com', 'anna@example.com', 'grace@example.com');
UPDATE users SET gender = 'male' WHERE email IN ('peter@example.com', 'thomas@example.com', 'joseph@example.com');
UPDATE users SET gender = 'male' WHERE email = 'admin@bartertrade.na';

-- ==========================================
-- VIEW FOR ADMIN DASHBOARD STATISTICS
-- ==========================================
CREATE OR REPLACE VIEW v_admin_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
    (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_users_week,
    (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_users_month,
    (SELECT COUNT(*) FROM users WHERE id_verification_status = 'pending') as pending_verifications,
    (SELECT COUNT(*) FROM users WHERE id_verification_status = 'approved') as verified_users,
    (SELECT COUNT(*) FROM listings WHERE status = 'active') as active_listings,
    (SELECT COUNT(*) FROM listings WHERE status = 'pending') as pending_listings,
    (SELECT COUNT(*) FROM listings WHERE status = 'flagged') as flagged_listings,
    (SELECT COUNT(*) FROM listings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_listings_week,
    (SELECT COUNT(*) FROM trade_offers WHERE status = 'accepted') as completed_trades,
    (SELECT COUNT(*) FROM trade_offers WHERE status = 'pending') as pending_trades,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'topup' AND status = 'completed') as total_topups,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'completed') as total_transaction_volume,
    (SELECT COUNT(*) FROM vouchers WHERE status = 'available') as available_vouchers,
    (SELECT COUNT(*) FROM vouchers WHERE status = 'redeemed') as redeemed_vouchers,
    (SELECT COALESCE(SUM(amount), 0) FROM vouchers WHERE status = 'redeemed') as redeemed_voucher_value,
    (SELECT COUNT(*) FROM listing_reports WHERE status = 'pending') as pending_listing_reports,
    (SELECT COUNT(*) FROM user_reports WHERE status = 'pending') as pending_user_reports;

-- ==========================================
-- STORED PROCEDURE FOR REPORT STATISTICS
-- ==========================================
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_get_report_stats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM listing_reports WHERE status = 'pending') as pending_listing_reports,
        (SELECT COUNT(*) FROM listing_reports WHERE status = 'resolved') as resolved_listing_reports,
        (SELECT COUNT(*) FROM listing_reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_reports_week,
        (SELECT COUNT(*) FROM user_reports WHERE status = 'pending') as pending_user_reports,
        (SELECT COUNT(*) FROM user_reports WHERE status = 'resolved') as resolved_user_reports,
        (SELECT COUNT(*) FROM users WHERE is_banned = TRUE) as banned_users,
        (SELECT COUNT(*) FROM listings WHERE status = 'flagged') as flagged_listings;
END //
DELIMITER ;

-- Grant permissions
GRANT ALL PRIVILEGES ON barter_trade.* TO 'barter_trade'@'%';
FLUSH PRIVILEGES;
