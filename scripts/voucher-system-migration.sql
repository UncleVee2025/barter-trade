-- Barter Trade Namibia - Voucher System Migration
-- =================================================
-- This script updates the voucher table to match the new specification
-- Run this script on your MySQL database
--
-- VOUCHER SYSTEM RULES:
-- 1. FIXED VALUES ONLY: 10, 20, 50, 100, 200 - No other values allowed
-- 2. User ID is mobile phone number
-- 3. Voucher types: scratch (physical cards), online (admin-approved payments)
-- 4. Status: unused, used, disabled (not deleted)
-- 5. All vouchers must exist in database - no manual voucher codes

USE barter_trade;

-- ==========================================
-- STEP 1: Update vouchers table structure
-- ==========================================

-- Add new columns if they don't exist
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS `type` ENUM('scratch', 'online') NOT NULL DEFAULT 'scratch' AFTER `amount`,
  ADD COLUMN IF NOT EXISTS `vendor` VARCHAR(255) NULL AFTER `type`,
  ADD COLUMN IF NOT EXISTS `batch_id` VARCHAR(36) NULL AFTER `vendor`,
  ADD COLUMN IF NOT EXISTS `used_by_phone` VARCHAR(20) NULL AFTER `redeemed_by`;

-- Rename columns to match new naming convention (if old names exist)
-- First check if old columns exist and rename them

-- Check and rename redeemed_by to used_by (keeping both for compatibility)
-- We'll keep redeemed_by for now and add used_by as alias
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS `used_by` VARCHAR(36) NULL AFTER `created_by`;

-- Update used_by from redeemed_by if it exists
UPDATE vouchers SET used_by = redeemed_by WHERE used_by IS NULL AND redeemed_by IS NOT NULL;

-- Add used_at column if it doesn't exist
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS `used_at` DATETIME NULL AFTER `used_by_phone`;

-- Update used_at from redeemed_at if it exists  
UPDATE vouchers SET used_at = redeemed_at WHERE used_at IS NULL AND redeemed_at IS NOT NULL;

-- Update status values to new naming
UPDATE vouchers SET status = 'unused' WHERE status = 'available';
UPDATE vouchers SET status = 'used' WHERE status = 'redeemed';
UPDATE vouchers SET status = 'disabled' WHERE status = 'cancelled';

-- ==========================================
-- STEP 2: Create indexes for performance
-- ==========================================

-- Create indexes safely (procedure to avoid duplicates)
DELIMITER //

DROP PROCEDURE IF EXISTS SafeAddVoucherIndex//

CREATE PROCEDURE SafeAddVoucherIndex(
    IN p_index_name VARCHAR(64),
    IN p_column_name VARCHAR(64)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'vouchers'
      AND INDEX_NAME = p_index_name;
    
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index_name, ' ON vouchers(', p_column_name, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

-- Create required indexes
CALL SafeAddVoucherIndex('idx_vouchers_code', 'code');
CALL SafeAddVoucherIndex('idx_vouchers_status', 'status');
CALL SafeAddVoucherIndex('idx_vouchers_type', 'type');
CALL SafeAddVoucherIndex('idx_vouchers_vendor', 'vendor');
CALL SafeAddVoucherIndex('idx_vouchers_batch_id', 'batch_id');
CALL SafeAddVoucherIndex('idx_vouchers_used_by', 'used_by');
CALL SafeAddVoucherIndex('idx_vouchers_used_by_phone', 'used_by_phone');
CALL SafeAddVoucherIndex('idx_vouchers_expires', 'expires_at');
CALL SafeAddVoucherIndex('idx_vouchers_created_by', 'created_by');

-- ==========================================
-- STEP 3: Create stored procedures
-- ==========================================

DELIMITER //

-- Drop existing procedures
DROP PROCEDURE IF EXISTS GenerateVoucherCode//
DROP PROCEDURE IF EXISTS CreateVoucherBatch//
DROP PROCEDURE IF EXISTS RedeemVoucher//
DROP PROCEDURE IF EXISTS SearchVouchers//

-- Generate cryptographically secure 10-digit numeric code
CREATE PROCEDURE GenerateVoucherCode(OUT voucher_code VARCHAR(10))
BEGIN
    DECLARE code_exists INT DEFAULT 1;
    DECLARE attempts INT DEFAULT 0;
    
    WHILE code_exists > 0 AND attempts < 100 DO
        -- Generate random 10-digit code (first digit 1-9, rest 0-9)
        SET voucher_code = CONCAT(
            FLOOR(1 + RAND() * 9),
            LPAD(FLOOR(RAND() * 1000000000), 9, '0')
        );
        
        SELECT COUNT(*) INTO code_exists FROM vouchers WHERE code = voucher_code;
        SET attempts = attempts + 1;
    END WHILE;
END//

-- Create a batch of scratch card vouchers for vendors
CREATE PROCEDURE CreateVoucherBatch(
    IN p_amount DECIMAL(10,2),
    IN p_quantity INT,
    IN p_vendor VARCHAR(255),
    IN p_admin_id VARCHAR(36),
    IN p_expiry_days INT,
    OUT p_batch_id VARCHAR(36),
    OUT p_created_count INT
)
proc_label: BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE new_code VARCHAR(10);
    DECLARE new_id VARCHAR(36);
    DECLARE expiry_date DATETIME;
    DECLARE valid_amounts VARCHAR(20) DEFAULT '10,20,50,100,200';
    
    -- Validate amount is in allowed denominations
    IF FIND_IN_SET(CAST(p_amount AS CHAR), valid_amounts) = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Invalid voucher amount. Allowed: 10, 20, 50, 100, 200';
    END IF;
    
    -- Validate quantity
    IF p_quantity < 1 OR p_quantity > 1000 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Quantity must be between 1 and 1000';
    END IF;
    
    -- Validate vendor name
    IF p_vendor IS NULL OR TRIM(p_vendor) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Vendor name is required for scratch card vouchers';
    END IF;
    
    SET p_batch_id = UUID();
    SET expiry_date = DATE_ADD(NOW(), INTERVAL p_expiry_days DAY);
    SET p_created_count = 0;
    
    START TRANSACTION;
    
    WHILE i < p_quantity DO
        CALL GenerateVoucherCode(new_code);
        SET new_id = UUID();
        
        INSERT INTO vouchers (
            id, code, amount, type, status, vendor, batch_id,
            created_by, expires_at, created_at
        ) VALUES (
            new_id, new_code, p_amount, 'scratch', 'unused', p_vendor, p_batch_id,
            p_admin_id, expiry_date, NOW()
        );
        
        SET i = i + 1;
        SET p_created_count = p_created_count + 1;
    END WHILE;
    
    -- Log activity
    INSERT INTO activity_log (id, user_id, action, entity_type, details, created_at)
    VALUES (
        UUID(), p_admin_id, 'create_voucher_batch', 'voucher',
        JSON_OBJECT(
            'batch_id', p_batch_id,
            'quantity', p_quantity,
            'amount', p_amount,
            'vendor', p_vendor,
            'total_value', p_amount * p_quantity
        ),
        NOW()
    );
    
    COMMIT;
END//

-- Redeem a voucher (transaction-safe)
CREATE PROCEDURE RedeemVoucher(
    IN p_voucher_code VARCHAR(10),
    IN p_user_id VARCHAR(36),
    IN p_user_phone VARCHAR(20),
    OUT p_success BOOLEAN,
    OUT p_amount DECIMAL(10,2),
    OUT p_new_balance DECIMAL(10,2),
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_voucher_id VARCHAR(36);
    DECLARE v_voucher_status VARCHAR(20);
    DECLARE v_voucher_amount DECIMAL(10,2);
    DECLARE v_expires_at DATETIME;
    DECLARE v_current_balance DECIMAL(10,2);
    DECLARE v_transaction_id VARCHAR(36);
    
    SET p_success = FALSE;
    SET p_amount = 0;
    SET p_new_balance = 0;
    SET p_message = '';
    
    START TRANSACTION;
    
    -- Lock and fetch voucher
    SELECT id, status, amount, expires_at 
    INTO v_voucher_id, v_voucher_status, v_voucher_amount, v_expires_at
    FROM vouchers 
    WHERE code = p_voucher_code
    FOR UPDATE;
    
    -- Validate voucher
    IF v_voucher_id IS NULL THEN
        SET p_message = 'Invalid voucher code';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF v_voucher_status = 'used' THEN
        SET p_message = 'This voucher has already been used';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF v_voucher_status = 'disabled' THEN
        SET p_message = 'This voucher has been disabled';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF v_voucher_status = 'expired' OR v_expires_at < NOW() THEN
        SET p_message = 'This voucher has expired';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    IF v_voucher_status != 'unused' THEN
        SET p_message = 'This voucher is not available';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Get user balance with lock
    SELECT wallet_balance INTO v_current_balance
    FROM users WHERE id = p_user_id FOR UPDATE;
    
    IF v_current_balance IS NULL THEN
        SET p_message = 'User not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    SET p_new_balance = v_current_balance + v_voucher_amount;
    SET v_transaction_id = UUID();
    
    -- Update user balance
    UPDATE users 
    SET wallet_balance = p_new_balance, updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Mark voucher as used
    UPDATE vouchers 
    SET status = 'used',
        used_by = p_user_id,
        used_by_phone = p_user_phone,
        used_at = NOW(),
        redeemed_by = p_user_id,
        redeemed_at = NOW()
    WHERE id = v_voucher_id;
    
    -- Create transaction record
    INSERT INTO transactions (
        id, user_id, type, amount, fee, balance_after, 
        status, reference, description, created_at
    ) VALUES (
        v_transaction_id, p_user_id, 'voucher', v_voucher_amount, 0, p_new_balance,
        'completed', p_voucher_code, CONCAT('Voucher redeemed: ', p_voucher_code), NOW()
    );
    
    -- Create notification
    INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
    VALUES (
        UUID(), p_user_id, 'wallet', 'Top-up Successful',
        CONCAT('N$', FORMAT(v_voucher_amount, 2), ' has been added to your wallet'),
        JSON_OBJECT('voucherCode', p_voucher_code, 'amount', v_voucher_amount),
        NOW()
    );
    
    COMMIT;
    
    SET p_success = TRUE;
    SET p_amount = v_voucher_amount;
    SET p_message = CONCAT('Top-up successful! N$', FORMAT(v_voucher_amount, 2), ' added to wallet.');
END//

-- Search vouchers for support
CREATE PROCEDURE SearchVouchers(
    IN p_voucher_code VARCHAR(20),
    IN p_user_phone VARCHAR(20)
)
BEGIN
    SELECT 
        v.id,
        v.code,
        v.amount,
        v.type,
        v.status,
        v.vendor,
        v.batch_id,
        v.used_by,
        v.used_by_phone,
        v.used_at,
        v.expires_at,
        v.created_at,
        u.name AS used_by_name,
        u.email AS used_by_email
    FROM vouchers v
    LEFT JOIN users u ON v.used_by = u.id
    WHERE 
        (p_voucher_code IS NOT NULL AND v.code = p_voucher_code)
        OR (p_user_phone IS NOT NULL AND v.used_by_phone = p_user_phone)
    ORDER BY v.created_at DESC;
END//

DELIMITER ;

-- ==========================================
-- STEP 4: Verify migration
-- ==========================================

SELECT 'Voucher System Migration Complete!' AS status;

-- Show table structure
DESCRIBE vouchers;

-- Show voucher statistics
SELECT 
    type,
    status,
    COUNT(*) as count,
    SUM(amount) as total_value
FROM vouchers
GROUP BY type, status;
