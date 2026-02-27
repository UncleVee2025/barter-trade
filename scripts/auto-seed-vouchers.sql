-- Barter Trade Namibia - Auto-Seed Vouchers Script
-- =================================================
-- This script generates vouchers with STRICTLY 10-digit NUMERIC codes
-- All voucher codes are numeric-only for easy vendor sales and mobile entry
-- Run this script after setting up the database schema
-- 
-- Database: MySQL hosted on cPanel
-- Connection Settings (from environment variables):
-- MYSQL_HOST=localhost
-- MYSQL_USER=barter_trade
-- MYSQL_PASSWORD=Freedom@2025
-- MYSQL_DATABASE=barter_trade
--
-- IMPORTANT: Voucher codes are ALWAYS 10-digit numeric (no letters)
-- Example codes: 1234567890, 9876543210, 5000000001

USE barter_trade;

-- ==========================================
-- HELPER PROCEDURE: Generate Cryptographically Secure 10-digit NUMERIC voucher code
-- Uses UUID entropy for better randomness
-- ==========================================
DELIMITER //

DROP PROCEDURE IF EXISTS GenerateVoucherCode//

CREATE PROCEDURE GenerateVoucherCode(OUT voucher_code VARCHAR(10))
BEGIN
    DECLARE code_exists INT DEFAULT 1;
    DECLARE attempts INT DEFAULT 0;
    DECLARE max_attempts INT DEFAULT 100;
    
    -- Keep generating until we get a unique code
    WHILE code_exists > 0 AND attempts < max_attempts DO
        -- Generate a cryptographically random 10-digit numeric code
        -- Uses UUID for entropy, converts to numeric format
        SET voucher_code = CONCAT(
            -- First digit: 1-9 (avoid leading zero for readability)
            FLOOR(1 + RAND(CONV(SUBSTRING(MD5(UUID()), 1, 6), 16, 10)) * 9),
            -- Remaining 9 digits: 0-9 each
            LPAD(FLOOR(RAND(CONV(SUBSTRING(MD5(UUID()), 7, 6), 16, 10)) * 1000000000), 9, '0')
        );
        
        -- Ensure exactly 10 digits
        SET voucher_code = LPAD(voucher_code, 10, '0');
        
        -- Double-check first digit isn't 0
        IF SUBSTRING(voucher_code, 1, 1) = '0' THEN
            SET voucher_code = CONCAT(FLOOR(1 + RAND() * 9), SUBSTRING(voucher_code, 2));
        END IF;
        
        -- Check if this code already exists
        SELECT COUNT(*) INTO code_exists FROM vouchers WHERE code = voucher_code;
        SET attempts = attempts + 1;
    END WHILE;
END//

DELIMITER ;

-- ==========================================
-- MAIN PROCEDURE: Generate multiple vouchers
-- ==========================================
DELIMITER //

DROP PROCEDURE IF EXISTS AutoSeedVouchers//

CREATE PROCEDURE AutoSeedVouchers(
    IN voucher_amount DECIMAL(15, 2),
    IN quantity INT,
    IN admin_id VARCHAR(36),
    IN expiry_days INT
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE new_code VARCHAR(10);
    DECLARE new_id VARCHAR(36);
    DECLARE expiry_date DATETIME;
    
    SET expiry_date = DATE_ADD(NOW(), INTERVAL expiry_days DAY);
    
    WHILE i < quantity DO
        -- Generate unique voucher code
        CALL GenerateVoucherCode(new_code);
        
        -- Generate UUID for voucher ID
        SET new_id = UUID();
        
        -- Insert the voucher
        INSERT INTO vouchers (id, code, amount, status, created_by, expires_at, created_at)
        VALUES (new_id, new_code, voucher_amount, 'available', admin_id, expiry_date, NOW());
        
        SET i = i + 1;
    END WHILE;
    
    SELECT CONCAT(quantity, ' vouchers created with amount N$', voucher_amount) AS result;
END//

DELIMITER ;

-- ==========================================
-- CLEAR EXISTING VOUCHERS (Optional - comment out if you want to keep existing ones)
-- ==========================================
-- DELETE FROM vouchers WHERE status = 'available';

-- ==========================================
-- GET ADMIN USER ID (create if not exists)
-- ==========================================
SET @admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- If no admin exists, create one
INSERT INTO users (id, email, password_hash, name, phone, region, role, wallet_balance, is_verified, created_at, updated_at)
SELECT 
    UUID(),
    'admin@bartertrade.na',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4W0.Qv3xM6Nh6T2u', -- admin123
    'System Admin',
    '+264 81 000 0000',
    'Khomas',
    'admin',
    10000.00,
    TRUE,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin');

-- Get admin ID again
SET @admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- ==========================================
-- GENERATE VOUCHERS: 20 each for N$10, N$20, N$50, N$100, N$200
-- ==========================================
CALL AutoSeedVouchers(10.00, 20, @admin_id, 365);
CALL AutoSeedVouchers(20.00, 20, @admin_id, 365);
CALL AutoSeedVouchers(50.00, 20, @admin_id, 365);
CALL AutoSeedVouchers(100.00, 20, @admin_id, 365);
CALL AutoSeedVouchers(200.00, 20, @admin_id, 365);

-- ==========================================
-- VERIFY VOUCHERS CREATED
-- ==========================================
SELECT 
    'Voucher Summary' AS report_type,
    amount AS 'Denomination (N$)',
    COUNT(*) AS 'Quantity',
    SUM(amount) AS 'Total Value (N$)'
FROM vouchers 
WHERE status = 'available' 
GROUP BY amount 
ORDER BY amount;

-- Overall totals
SELECT 
    'Overall Totals' AS report_type,
    COUNT(*) AS 'Total Vouchers',
    SUM(amount) AS 'Total Value (N$)',
    MIN(code) AS 'Sample Code 1',
    MAX(code) AS 'Sample Code 2'
FROM vouchers 
WHERE status = 'available';

-- Show a few sample voucher codes
SELECT 
    'Sample Vouchers' AS report_type,
    code AS 'Voucher Code (10 digits)',
    CONCAT('N$', amount) AS 'Value',
    status,
    DATE_FORMAT(expires_at, '%Y-%m-%d') AS 'Expires'
FROM vouchers 
WHERE status = 'available'
ORDER BY RAND()
LIMIT 10;
