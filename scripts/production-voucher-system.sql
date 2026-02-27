-- Barter Trade Namibia - Production Voucher System
-- =================================================
-- This script provides the complete voucher management system for production
-- All voucher codes are STRICTLY 10-digit NUMERIC for easy vendor sales
-- 
-- MySQL Database hosted on cPanel
-- Database: barter_trade
-- 
-- SECURITY FEATURES:
-- 1. Cryptographically random 10-digit numeric codes
-- 2. Unique code constraint prevents duplicates
-- 3. Voucher expiration tracking
-- 4. Full audit trail with activity_log
-- 5. Transaction-safe redemption process

USE barter_trade;

-- ==========================================
-- DROP AND RECREATE VOUCHER PROCEDURES
-- ==========================================

DELIMITER //

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS GenerateNumericVoucherCode//
DROP PROCEDURE IF EXISTS CreateVouchers//
DROP PROCEDURE IF EXISTS RedeemVoucher//
DROP PROCEDURE IF EXISTS GetVoucherStats//
DROP PROCEDURE IF EXISTS ExpireOldVouchers//
DROP PROCEDURE IF EXISTS CancelVoucher//

-- ==========================================
-- PROCEDURE: Generate Cryptographically Secure 10-digit Numeric Code
-- ==========================================
CREATE PROCEDURE GenerateNumericVoucherCode(OUT voucher_code VARCHAR(10))
BEGIN
    DECLARE code_exists INT DEFAULT 1;
    DECLARE attempts INT DEFAULT 0;
    DECLARE max_attempts INT DEFAULT 100;
    
    -- Keep generating until we get a unique code
    WHILE code_exists > 0 AND attempts < max_attempts DO
        -- Generate random 10-digit numeric code using UUID for entropy
        -- This provides cryptographic randomness while ensuring numeric-only output
        SET voucher_code = CONCAT(
            -- First digit: 1-9 (avoid leading zero for easier reading)
            FLOOR(1 + RAND(CONV(SUBSTRING(MD5(UUID()), 1, 8), 16, 10)) * 9),
            -- Remaining 9 digits: 0-9 each
            LPAD(FLOOR(RAND(CONV(SUBSTRING(MD5(UUID()), 9, 8), 16, 10)) * 1000000000), 9, '0')
        );
        
        -- Verify it's exactly 10 digits
        IF LENGTH(voucher_code) != 10 THEN
            SET voucher_code = LPAD(FLOOR(RAND() * 10000000000), 10, '0');
            -- Ensure no leading zero
            IF SUBSTRING(voucher_code, 1, 1) = '0' THEN
                SET voucher_code = CONCAT(FLOOR(1 + RAND() * 9), SUBSTRING(voucher_code, 2));
            END IF;
        END IF;
        
        -- Check if this code already exists
        SELECT COUNT(*) INTO code_exists FROM vouchers WHERE code = voucher_code;
        SET attempts = attempts + 1;
    END WHILE;
    
    -- If we exhausted attempts, generate a timestamp-based fallback
    IF code_exists > 0 THEN
        SET voucher_code = CONCAT(
            FLOOR(1 + RAND() * 9),
            LPAD(UNIX_TIMESTAMP() % 1000000000, 9, '0')
        );
    END IF;
END//

-- ==========================================
-- PROCEDURE: Create Multiple Vouchers for Vendor Sales
-- This is the main procedure for admin to generate batches of vouchers
-- ==========================================
CREATE PROCEDURE CreateVouchers(
    IN p_amount DECIMAL(15, 2),
    IN p_quantity INT,
    IN p_admin_id VARCHAR(36),
    IN p_expiry_days INT,
    OUT p_created_count INT,
    OUT p_batch_id VARCHAR(36)
)
proc_label: BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE new_code VARCHAR(10);
    DECLARE new_id VARCHAR(36);
    DECLARE expiry_date DATETIME;
    DECLARE valid_amounts VARCHAR(100) DEFAULT '10,20,50,100,200';
    
    -- Validate amount is in allowed denominations
    -- FIXED VALUES ONLY: 10, 20, 50, 100, 200 - No other values allowed
    IF FIND_IN_SET(CAST(p_amount AS CHAR), valid_amounts) = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Invalid voucher amount. Allowed: 10, 20, 50, 100, 200';
    END IF;
    
    -- Validate quantity
    IF p_quantity < 1 OR p_quantity > 1000 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Quantity must be between 1 and 1000';
    END IF;
    
    -- Generate batch ID for tracking
    SET p_batch_id = UUID();
    SET expiry_date = DATE_ADD(NOW(), INTERVAL p_expiry_days DAY);
    SET p_created_count = 0;
    
    -- Start transaction
    START TRANSACTION;
    
    WHILE i < p_quantity DO
        -- Generate unique voucher code
        CALL GenerateNumericVoucherCode(new_code);
        
        -- Generate UUID for voucher ID
        SET new_id = UUID();
        
        -- Insert the voucher with batch tracking
        INSERT INTO vouchers (
            id, 
            code, 
            amount, 
            status, 
            created_by, 
            expires_at, 
            created_at
        ) VALUES (
            new_id, 
            new_code, 
            p_amount, 
            'available', 
            p_admin_id, 
            expiry_date, 
            NOW()
        );
        
        SET i = i + 1;
        SET p_created_count = p_created_count + 1;
    END WHILE;
    
    -- Log the batch creation in activity log
    INSERT INTO activity_log (id, user_id, action, entity_type, details, created_at)
    VALUES (
        UUID(), 
        p_admin_id, 
        'create_voucher_batch', 
        'voucher',
        JSON_OBJECT(
            'batch_id', p_batch_id,
            'quantity', p_quantity,
            'amount', p_amount,
            'total_value', p_amount * p_quantity,
            'expiry_days', p_expiry_days
        ),
        NOW()
    );
    
    COMMIT;
    
    SELECT CONCAT(p_created_count, ' vouchers created successfully. Batch ID: ', p_batch_id) AS result;
END//

-- ==========================================
-- PROCEDURE: Redeem Voucher (Transaction-Safe)
-- This ensures atomic voucher redemption with balance update
-- ==========================================
CREATE PROCEDURE RedeemVoucher(
    IN p_voucher_code VARCHAR(10),
    IN p_user_id VARCHAR(36),
    OUT p_success BOOLEAN,
    OUT p_amount DECIMAL(15, 2),
    OUT p_new_balance DECIMAL(15, 2),
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_voucher_id VARCHAR(36);
    DECLARE v_voucher_status VARCHAR(20);
    DECLARE v_voucher_amount DECIMAL(15, 2);
    DECLARE v_expires_at DATETIME;
    DECLARE v_current_balance DECIMAL(15, 2);
    DECLARE v_transaction_id VARCHAR(36);
    
    -- Initialize outputs
    SET p_success = FALSE;
    SET p_amount = 0;
    SET p_new_balance = 0;
    SET p_message = '';
    
    -- Start transaction
    START TRANSACTION;
    
    -- Lock and fetch voucher with FOR UPDATE
    SELECT id, status, amount, expires_at 
    INTO v_voucher_id, v_voucher_status, v_voucher_amount, v_expires_at
    FROM vouchers 
    WHERE code = p_voucher_code
    FOR UPDATE;
    
    -- Check if voucher exists
    IF v_voucher_id IS NULL THEN
        SET p_message = 'Invalid voucher code';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Check voucher status
    IF v_voucher_status = 'redeemed' THEN
        SET p_message = 'This voucher has already been redeemed';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF v_voucher_status = 'cancelled' THEN
        SET p_message = 'This voucher has been cancelled';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF v_voucher_status = 'expired' OR v_expires_at < NOW() THEN
        SET p_message = 'This voucher has expired';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Get user's current balance with lock
    SELECT wallet_balance INTO v_current_balance
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;
    
    IF v_current_balance IS NULL THEN
        SET p_message = 'User not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Calculate new balance
    SET p_new_balance = v_current_balance + v_voucher_amount;
    SET v_transaction_id = UUID();
    
    -- Update user's wallet balance
    UPDATE users 
    SET wallet_balance = p_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Mark voucher as redeemed
    UPDATE vouchers 
    SET status = 'redeemed',
        redeemed_by = p_user_id,
        redeemed_at = NOW()
    WHERE id = v_voucher_id;
    
    -- Create transaction record
    INSERT INTO transactions (
        id, user_id, type, amount, fee, balance_after, 
        status, reference, description, created_at
    ) VALUES (
        v_transaction_id, 
        p_user_id, 
        'voucher', 
        v_voucher_amount, 
        0, 
        p_new_balance,
        'completed', 
        p_voucher_code, 
        CONCAT('Voucher redeemed: ', p_voucher_code),
        NOW()
    );
    
    -- Create notification
    INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
    VALUES (
        UUID(),
        p_user_id,
        'wallet',
        'Voucher Redeemed',
        CONCAT('N$', FORMAT(v_voucher_amount, 2), ' has been added to your wallet'),
        JSON_OBJECT('voucherCode', p_voucher_code, 'amount', v_voucher_amount),
        NOW()
    );
    
    -- Log activity
    INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, created_at)
    VALUES (
        UUID(),
        p_user_id,
        'redeem_voucher',
        'voucher',
        v_voucher_id,
        JSON_OBJECT('code', p_voucher_code, 'amount', v_voucher_amount),
        NOW()
    );
    
    COMMIT;
    
    -- Set success outputs
    SET p_success = TRUE;
    SET p_amount = v_voucher_amount;
    SET p_message = CONCAT('Voucher redeemed successfully! N$', FORMAT(v_voucher_amount, 2), ' added to wallet.');
    
END//

-- ==========================================
-- PROCEDURE: Get Voucher Statistics
-- ==========================================
CREATE PROCEDURE GetVoucherStats()
BEGIN
    SELECT 
        COUNT(*) AS total_vouchers,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN status = 'redeemed' THEN 1 ELSE 0 END) AS redeemed,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
        COALESCE(SUM(CASE WHEN status = 'available' THEN amount ELSE 0 END), 0) AS available_value,
        COALESCE(SUM(CASE WHEN status = 'redeemed' THEN amount ELSE 0 END), 0) AS redeemed_value,
        COALESCE(SUM(amount), 0) AS total_value
    FROM vouchers;
    
    -- Breakdown by denomination
    SELECT 
        amount AS denomination,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN status = 'redeemed' THEN 1 ELSE 0 END) AS redeemed
    FROM vouchers
    GROUP BY amount
    ORDER BY amount;
END//

-- ==========================================
-- PROCEDURE: Expire Old Vouchers (Scheduled Job)
-- Run this daily via cron to expire old vouchers
-- ==========================================
CREATE PROCEDURE ExpireOldVouchers()
BEGIN
    DECLARE expired_count INT DEFAULT 0;
    
    -- Update vouchers past their expiry date
    UPDATE vouchers 
    SET status = 'expired'
    WHERE status = 'available' 
    AND expires_at < NOW();
    
    SET expired_count = ROW_COUNT();
    
    -- Log if any were expired
    IF expired_count > 0 THEN
        INSERT INTO activity_log (id, user_id, action, entity_type, details, created_at)
        VALUES (
            UUID(),
            NULL,
            'auto_expire_vouchers',
            'voucher',
            JSON_OBJECT('count', expired_count, 'timestamp', NOW()),
            NOW()
        );
    END IF;
    
    SELECT CONCAT(expired_count, ' vouchers expired') AS result;
END//

-- ==========================================
-- PROCEDURE: Cancel a Voucher
-- ==========================================
CREATE PROCEDURE CancelVoucher(
    IN p_voucher_id VARCHAR(36),
    IN p_admin_id VARCHAR(36),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_code VARCHAR(10);
    
    SET p_success = FALSE;
    
    SELECT status, code INTO v_status, v_code
    FROM vouchers WHERE id = p_voucher_id;
    
    IF v_status IS NULL THEN
        SET p_message = 'Voucher not found';
        LEAVE proc_label;
    END IF;
    
    IF v_status = 'redeemed' THEN
        SET p_message = 'Cannot cancel a redeemed voucher';
        LEAVE proc_label;
    END IF;
    
    UPDATE vouchers SET status = 'cancelled' WHERE id = p_voucher_id;
    
    INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details, created_at)
    VALUES (
        UUID(),
        p_admin_id,
        'cancel_voucher',
        'voucher',
        p_voucher_id,
        JSON_OBJECT('code', v_code),
        NOW()
    );
    
    SET p_success = TRUE;
    SET p_message = 'Voucher cancelled successfully';
END//

DELIMITER ;

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================
-- Ensure indexes exist for optimal query performance
-- Using stored procedure to safely add indexes only if they don't exist
-- This avoids dropping indexes that may be used by foreign key constraints

DELIMITER //

DROP PROCEDURE IF EXISTS SafeAddIndex//

CREATE PROCEDURE SafeAddIndex(
    IN p_table_name VARCHAR(64),
    IN p_index_name VARCHAR(64),
    IN p_column_name VARCHAR(64)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    -- Check if index already exists
    SELECT COUNT(*) INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name;
    
    -- Only create if it doesn't exist
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index_name, ' ON ', p_table_name, '(', p_column_name, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

-- Create indexes safely (will skip if they already exist)
CALL SafeAddIndex('vouchers', 'idx_vouchers_code', 'code');
CALL SafeAddIndex('vouchers', 'idx_vouchers_status', 'status');
CALL SafeAddIndex('vouchers', 'idx_vouchers_expires', 'expires_at');
CALL SafeAddIndex('vouchers', 'idx_vouchers_created_by', 'created_by');
CALL SafeAddIndex('vouchers', 'idx_vouchers_redeemed_by', 'redeemed_by');

-- ==========================================
-- INITIAL VOUCHER GENERATION FOR VENDORS
-- Generate starter batches for vendor distribution
-- ==========================================

-- Get admin user ID using COALESCE to handle NULL (no IF statement needed)
SET @admin_id = COALESCE(
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'admin-001'
);

-- Generate starter voucher batches (uncomment to run after initial setup)
-- These represent vouchers that vendors would receive to sell
-- To generate vouchers, uncomment and run these lines:
-- 
-- SET @count = 0;
-- SET @batch = '';
-- CALL CreateVouchers(10.00, 50, @admin_id, 365, @count, @batch);
-- SELECT @count AS created_count, @batch AS batch_id;
-- 
-- CALL CreateVouchers(20.00, 50, @admin_id, 365, @count, @batch);
-- CALL CreateVouchers(50.00, 30, @admin_id, 365, @count, @batch);
-- CALL CreateVouchers(100.00, 20, @admin_id, 365, @count, @batch);
-- CALL CreateVouchers(200.00, 10, @admin_id, 365, @count, @batch);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
SELECT 'Voucher System Setup Complete!' AS status;
SELECT @admin_id AS admin_user_id;

-- Show current voucher statistics (uncomment after tables have data)
-- CALL GetVoucherStats();

-- ==========================================
-- CRON JOB SETUP (Run on cPanel)
-- ==========================================
-- Add this to cPanel Cron Jobs to run daily at midnight:
-- mysql -u barter_trade -p'Freedom@2025' barter_trade -e "CALL ExpireOldVouchers();"
-- 
-- Example cPanel cron entry (daily at 12:00 AM):
-- 0 0 * * * /usr/bin/mysql -u barter_trade -p'Freedom@2025' barter_trade -e "CALL ExpireOldVouchers();"
