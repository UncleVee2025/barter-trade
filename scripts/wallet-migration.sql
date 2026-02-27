-- Barter Trade Namibia - Wallet System Migration
-- This script adds the topup_requests table for mobile money top-ups
-- and auto-generates vouchers with 10-digit NUMERIC codes
--
-- Connection Settings:
-- MYSQL_HOST=localhost
-- MYSQL_USER=barter_trade
-- MYSQL_PASSWORD=Freedom@2025
-- MYSQL_DATABASE=barter_trade

USE barter_trade;

-- ==========================================
-- TOP-UP REQUESTS TABLE
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    processed_by VARCHAR(36),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- CLEAR EXISTING VOUCHERS (Optional - only if starting fresh)
-- ==========================================
-- TRUNCATE TABLE vouchers;

-- ==========================================
-- GENERATE VOUCHERS
-- Creates 20 vouchers for each denomination: N$10, N$20, N$50, N$100, N$200
-- Each voucher has a unique 10-digit numeric code
-- ==========================================

-- Helper procedure to generate vouchers
DELIMITER //

DROP PROCEDURE IF EXISTS GenerateVouchers//

CREATE PROCEDURE GenerateVouchers(
    IN voucher_amount DECIMAL(15, 2),
    IN quantity INT,
    IN admin_id VARCHAR(36)
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE new_code VARCHAR(10);
    DECLARE code_exists INT;
    DECLARE new_id VARCHAR(36);
    DECLARE expiry_date DATETIME;
    
    SET expiry_date = DATE_ADD(NOW(), INTERVAL 1 YEAR);
    
    WHILE i < quantity DO
        -- Generate random 10-digit code
        SET new_code = LPAD(FLOOR(RAND() * 10000000000), 10, '0');
        
        -- Check if code already exists
        SELECT COUNT(*) INTO code_exists FROM vouchers WHERE code = new_code;
        
        -- If code doesn't exist, insert the voucher
        IF code_exists = 0 THEN
            SET new_id = UUID();
            INSERT INTO vouchers (id, code, amount, status, created_by, expires_at, created_at)
            VALUES (new_id, new_code, voucher_amount, 'available', admin_id, expiry_date, NOW());
            SET i = i + 1;
        END IF;
    END WHILE;
END//

DELIMITER ;

-- Get admin user ID (or use a default if not found)
SET @admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- Generate vouchers for each denomination (20 each)
CALL GenerateVouchers(10.00, 20, @admin_id);
CALL GenerateVouchers(20.00, 20, @admin_id);
CALL GenerateVouchers(50.00, 20, @admin_id);
CALL GenerateVouchers(100.00, 20, @admin_id);
CALL GenerateVouchers(200.00, 20, @admin_id);

-- Verify the vouchers were created
SELECT amount, COUNT(*) as count, SUM(amount) as total_value 
FROM vouchers 
WHERE status = 'available' 
GROUP BY amount 
ORDER BY amount;

-- Show summary
SELECT 
    'Vouchers Generated' as status,
    COUNT(*) as total_vouchers,
    SUM(CASE WHEN amount = 10 THEN 1 ELSE 0 END) as 'N$10',
    SUM(CASE WHEN amount = 20 THEN 1 ELSE 0 END) as 'N$20',
    SUM(CASE WHEN amount = 50 THEN 1 ELSE 0 END) as 'N$50',
    SUM(CASE WHEN amount = 100 THEN 1 ELSE 0 END) as 'N$100',
    SUM(CASE WHEN amount = 200 THEN 1 ELSE 0 END) as 'N$200',
    SUM(amount) as total_value
FROM vouchers 
WHERE status = 'available';
