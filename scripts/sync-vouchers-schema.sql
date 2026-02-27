-- Migration Script: Sync Vouchers Table Schema with Application Code
-- This script updates the vouchers table to match the expected status values
-- in the application code ('unused', 'used', 'disabled', 'expired', 'exported')
-- 
-- The uploaded SQL schema uses: 'available', 'redeemed', 'expired', 'cancelled'
-- The application code expects: 'unused', 'used', 'disabled', 'expired', 'exported'

-- Start with a safety check for existing data
SET @has_vouchers = (SELECT COUNT(*) FROM vouchers);
SELECT CONCAT('Found ', @has_vouchers, ' vouchers in database') AS migration_info;

-- Step 1: Convert existing status values to match application expectations
-- Map 'available' -> 'unused', 'redeemed' -> 'used', 'cancelled' -> 'disabled'
UPDATE vouchers SET status = 'unused' WHERE status = 'available';
UPDATE vouchers SET status = 'used' WHERE status = 'redeemed';  
UPDATE vouchers SET status = 'disabled' WHERE status = 'cancelled';

-- Step 2: Alter the enum to include all required values
-- Note: MySQL requires recreating the enum with all values
ALTER TABLE vouchers 
MODIFY COLUMN status ENUM('unused', 'used', 'disabled', 'expired', 'exported') 
DEFAULT 'unused';

-- Step 3: Check for any empty/null status values and set them to 'unused'
UPDATE vouchers SET status = 'unused' WHERE status IS NULL OR status = '';

-- Step 4: Verify the migration
SELECT 
  COUNT(*) as total_vouchers,
  SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as unused_count,
  SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used_count,
  SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled_count,
  SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_count,
  SUM(CASE WHEN status = 'exported' THEN 1 ELSE 0 END) as exported_count
FROM vouchers;

-- Step 5: Create index for better voucher lookup performance if not exists
-- These are safe to run even if they already exist (will just skip)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS SafeCreateVoucherIndex(
  IN index_name VARCHAR(64),
  IN column_def VARCHAR(255)
)
BEGIN
  DECLARE index_exists INT DEFAULT 0;
  
  SELECT COUNT(*) INTO index_exists
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'vouchers'
    AND INDEX_NAME = index_name;
  
  IF index_exists = 0 THEN
    SET @sql = CONCAT('CREATE INDEX ', index_name, ' ON vouchers(', column_def, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SELECT CONCAT('Created index: ', index_name) AS index_status;
  ELSE
    SELECT CONCAT('Index already exists: ', index_name) AS index_status;
  END IF;
END//
DELIMITER ;

-- Create indexes for common queries
CALL SafeCreateVoucherIndex('idx_vouchers_code', 'code');
CALL SafeCreateVoucherIndex('idx_vouchers_status', 'status');
CALL SafeCreateVoucherIndex('idx_vouchers_vendor', 'vendor');
CALL SafeCreateVoucherIndex('idx_vouchers_batch', 'batch_id');

-- Clean up procedure
DROP PROCEDURE IF EXISTS SafeCreateVoucherIndex;

SELECT 'Voucher schema migration completed successfully!' AS result;
