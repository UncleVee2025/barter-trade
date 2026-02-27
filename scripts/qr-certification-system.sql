-- QR Code & Digital Business Card Certification System
-- For Barter Trade Namibia Platform
-- FIXED: Foreign key constraints to match users table schema

-- =====================================================
-- 1. Add certification columns to users table
-- =====================================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT FALSE COMMENT 'Whether user is certified trader',
ADD COLUMN IF NOT EXISTS certified_at DATETIME NULL COMMENT 'When user was certified',
ADD COLUMN IF NOT EXISTS certified_by VARCHAR(36) NULL COMMENT 'Admin who certified (NULL = auto-certified)',
ADD COLUMN IF NOT EXISTS certification_reason VARCHAR(500) NULL COMMENT 'Reason for manual certification',
ADD COLUMN IF NOT EXISTS qr_code VARCHAR(100) NULL COMMENT 'Unique QR code identifier for user',
ADD COLUMN IF NOT EXISTS completed_trades INT DEFAULT 0 COMMENT 'Count of completed successful trades';

-- Add index for QR code lookups
CREATE INDEX IF NOT EXISTS idx_users_qr_code ON users(qr_code);
CREATE INDEX IF NOT EXISTS idx_users_is_certified ON users(is_certified);

-- =====================================================
-- 2. Create certification audit log table
-- FIXED: Use correct column types matching users table
-- =====================================================
CREATE TABLE IF NOT EXISTS certification_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    action ENUM('auto_certified', 'admin_certified', 'admin_revoked') NOT NULL,
    admin_id VARCHAR(36) NULL COMMENT 'Admin who performed action',
    reason VARCHAR(500) NULL COMMENT 'Reason for certification/revocation',
    trades_at_certification INT DEFAULT 0 COMMENT 'Number of trades when certified',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cert_logs_user (user_id),
    INDEX idx_cert_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign keys separately after table creation to avoid constraint issues
-- This allows the table to be created even if users table structure varies
ALTER TABLE certification_logs 
ADD CONSTRAINT fk_cert_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================
-- 3. Create business card generation log table
-- =====================================================
CREATE TABLE IF NOT EXISTS business_card_downloads (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    INDEX idx_card_downloads_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE business_card_downloads 
ADD CONSTRAINT fk_card_downloads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================
-- 4. Create QR code scan log table (for analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS qr_scans (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    scanned_user_id VARCHAR(36) NOT NULL COMMENT 'User whose QR was scanned',
    scanner_user_id VARCHAR(36) NULL COMMENT 'User who scanned (NULL if not logged in)',
    action ENUM('view_profile', 'view_listings', 'send_credits', 'make_offer') DEFAULT 'view_profile',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_qr_scans_user (scanned_user_id),
    INDEX idx_qr_scans_date (scanned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE qr_scans 
ADD CONSTRAINT fk_qr_scans_scanned_user FOREIGN KEY (scanned_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================
-- 5. Create system settings for certification (if not exists)
-- =====================================================
INSERT IGNORE INTO system_settings (id, setting_key, setting_value, description, updated_at)
VALUES 
    (UUID(), 'certification_trades_required', '10', 'Number of successful trades required for auto-certification', NOW()),
    (UUID(), 'certification_badge_title', 'Accredited Barter Trader', 'Title displayed on business cards', NOW()),
    (UUID(), 'certification_enabled', 'true', 'Whether certification system is enabled', NOW());

-- =====================================================
-- 6. Generate QR codes for existing users
-- =====================================================
UPDATE users 
SET qr_code = CONCAT('BTN-', UPPER(SUBSTRING(id, 1, 8)), '-', LPAD(FLOOR(RAND() * 100000), 5, '0'))
WHERE qr_code IS NULL;

-- =====================================================
-- 7. Update completed_trades count for existing users
-- Based on accepted trade_offers
-- =====================================================
UPDATE users u
SET completed_trades = (
    SELECT COUNT(*) 
    FROM trade_offers t 
    WHERE (t.sender_id = u.id OR t.receiver_id = u.id) 
    AND t.status = 'accepted'
);

-- =====================================================
-- 8. Auto-certify users with 10+ completed trades
-- =====================================================
UPDATE users 
SET is_certified = TRUE,
    certified_at = NOW(),
    certified_by = NULL,
    certification_reason = 'Auto-certified: Completed 10+ successful trades'
WHERE completed_trades >= 10 
AND (is_certified = FALSE OR is_certified IS NULL);

-- Log auto-certifications
INSERT INTO certification_logs (id, user_id, action, admin_id, reason, trades_at_certification, created_at)
SELECT 
    UUID(),
    id,
    'auto_certified',
    NULL,
    'Auto-certified: Completed 10+ successful trades',
    completed_trades,
    NOW()
FROM users 
WHERE is_certified = TRUE 
AND certified_by IS NULL
AND id NOT IN (SELECT user_id FROM certification_logs WHERE action = 'auto_certified');

-- =====================================================
-- 9. Create trigger to auto-certify on trade completion
-- =====================================================
DROP TRIGGER IF EXISTS trg_auto_certify_on_trade;

DELIMITER //
CREATE TRIGGER trg_auto_certify_on_trade
AFTER UPDATE ON trade_offers
FOR EACH ROW
BEGIN
    DECLARE trade_count INT;
    DECLARE trades_needed INT DEFAULT 10;
    DECLARE user_certified BOOLEAN;
    
    -- Only process when status changes to 'accepted' (completed trade)
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        -- Update sender's trade count
        UPDATE users SET completed_trades = completed_trades + 1 WHERE id = NEW.sender_id;
        
        -- Update receiver's trade count
        UPDATE users SET completed_trades = completed_trades + 1 WHERE id = NEW.receiver_id;
        
        -- Check if sender needs certification
        SELECT completed_trades, COALESCE(is_certified, FALSE) INTO trade_count, user_certified 
        FROM users WHERE id = NEW.sender_id;
        
        IF trade_count >= trades_needed AND user_certified = FALSE THEN
            UPDATE users SET 
                is_certified = TRUE,
                certified_at = NOW(),
                certification_reason = 'Auto-certified: Completed 10+ successful trades'
            WHERE id = NEW.sender_id;
            
            INSERT INTO certification_logs (id, user_id, action, reason, trades_at_certification, created_at)
            VALUES (UUID(), NEW.sender_id, 'auto_certified', 'Auto-certified: Completed 10+ successful trades', trade_count, NOW());
        END IF;
        
        -- Check if receiver needs certification
        SELECT completed_trades, COALESCE(is_certified, FALSE) INTO trade_count, user_certified 
        FROM users WHERE id = NEW.receiver_id;
        
        IF trade_count >= trades_needed AND user_certified = FALSE THEN
            UPDATE users SET 
                is_certified = TRUE,
                certified_at = NOW(),
                certification_reason = 'Auto-certified: Completed 10+ successful trades'
            WHERE id = NEW.receiver_id;
            
            INSERT INTO certification_logs (id, user_id, action, reason, trades_at_certification, created_at)
            VALUES (UUID(), NEW.receiver_id, 'auto_certified', 'Auto-certified: Completed 10+ successful trades', trade_count, NOW());
        END IF;
    END IF;
END//
DELIMITER ;

-- =====================================================
-- 10. Create trigger to generate QR code for new users
-- =====================================================
DROP TRIGGER IF EXISTS trg_generate_user_qr;

DELIMITER //
CREATE TRIGGER trg_generate_user_qr
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.qr_code IS NULL THEN
        SET NEW.qr_code = CONCAT('BTN-', UPPER(SUBSTRING(NEW.id, 1, 8)), '-', LPAD(FLOOR(RAND() * 100000), 5, '0'));
    END IF;
    IF NEW.completed_trades IS NULL THEN
        SET NEW.completed_trades = 0;
    END IF;
    IF NEW.is_certified IS NULL THEN
        SET NEW.is_certified = FALSE;
    END IF;
END//
DELIMITER ;

SELECT 'QR Code & Certification System Migration Complete' AS status;
