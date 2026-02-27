-- Barter Trade Namibia - Admin Dashboard Enhancement Script
-- This script adds activity logging, analytics, and admin-specific tables
-- Safe to run multiple times (uses IF NOT EXISTS)
-- For cPanel MySQL deployment

USE barter_trade;

-- ==========================================
-- ACTIVITY LOG TABLE (Comprehensive audit trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    admin_id VARCHAR(36),
    type ENUM(
        'user_register', 'user_login', 'user_logout', 'user_update', 'user_ban', 'user_unban', 'user_delete',
        'listing_create', 'listing_update', 'listing_delete', 'listing_approve', 'listing_reject', 'listing_flag',
        'trade_create', 'trade_accept', 'trade_reject', 'trade_complete', 'trade_cancel',
        'wallet_topup', 'wallet_transfer', 'wallet_voucher', 'wallet_adjust',
        'voucher_create', 'voucher_redeem', 'voucher_cancel',
        'report_create', 'report_review', 'report_resolve', 'report_dismiss',
        'notification_send', 'notification_broadcast',
        'admin_login', 'admin_action', 'system_config', 'system_backup'
    ) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type ENUM('user', 'listing', 'trade', 'transaction', 'voucher', 'report', 'notification', 'system') NULL,
    entity_id VARCHAR(36) NULL,
    description TEXT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_admin (admin_id),
    INDEX idx_type (type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- DAILY ANALYTICS TABLE (Aggregated daily stats)
-- ==========================================
CREATE TABLE IF NOT EXISTS analytics_daily (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    date DATE NOT NULL UNIQUE,
    new_users INT DEFAULT 0,
    active_users INT DEFAULT 0,
    new_listings INT DEFAULT 0,
    active_listings INT DEFAULT 0,
    pending_listings INT DEFAULT 0,
    total_trades INT DEFAULT 0,
    completed_trades INT DEFAULT 0,
    trade_volume DECIMAL(15, 2) DEFAULT 0.00,
    wallet_topups DECIMAL(15, 2) DEFAULT 0.00,
    wallet_transfers DECIMAL(15, 2) DEFAULT 0.00,
    vouchers_redeemed INT DEFAULT 0,
    voucher_value DECIMAL(15, 2) DEFAULT 0.00,
    revenue_listing_fees DECIMAL(15, 2) DEFAULT 0.00,
    revenue_transfer_fees DECIMAL(15, 2) DEFAULT 0.00,
    revenue_total DECIMAL(15, 2) DEFAULT 0.00,
    reports_created INT DEFAULT 0,
    reports_resolved INT DEFAULT 0,
    page_views INT DEFAULT 0,
    api_calls INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- ==========================================
-- SYSTEM SETTINGS TABLE
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
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_key (setting_key)
) ENGINE=InnoDB;

-- ==========================================
-- ADMIN NOTIFICATIONS TABLE (System alerts for admins)
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
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- TOP-UP REQUESTS TABLE (Mobile Money/Bank Transfers)
-- ==========================================
CREATE TABLE IF NOT EXISTS topup_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('mobile_money', 'bank_transfer', 'cash_deposit') NOT NULL,
    provider VARCHAR(50),
    reference_number VARCHAR(100),
    receipt_url VARCHAR(500),
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    rejection_reason VARCHAR(255),
    notes TEXT,
    processed_by VARCHAR(36),
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- ==========================================
INSERT IGNORE INTO system_settings (id, setting_key, setting_value, setting_type, category, description) VALUES
-- General Settings
(UUID(), 'site_name', 'Barter Trade Namibia', 'string', 'general', 'Platform name'),
(UUID(), 'site_tagline', 'Trade Smart. Live Better.', 'string', 'general', 'Platform tagline'),
(UUID(), 'maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode'),
(UUID(), 'registration_enabled', 'true', 'boolean', 'general', 'Allow new user registrations'),

-- Listing Settings
(UUID(), 'listing_require_approval', 'false', 'boolean', 'listings', 'Require admin approval for new listings'),
(UUID(), 'listing_max_images', '10', 'number', 'listings', 'Maximum images per listing'),
(UUID(), 'listing_max_value', '5000000', 'number', 'listings', 'Maximum listing value in NAD'),
(UUID(), 'listing_expiry_days', '90', 'number', 'listings', 'Days until listing expires'),
(UUID(), 'featured_listing_cost', '50', 'number', 'listings', 'Cost to feature a listing'),

-- Wallet Settings
(UUID(), 'wallet_min_topup', '10', 'number', 'wallet', 'Minimum top-up amount'),
(UUID(), 'wallet_max_topup', '50000', 'number', 'wallet', 'Maximum top-up amount'),
(UUID(), 'wallet_transfer_fee_percent', '2.5', 'number', 'wallet', 'Transfer fee percentage'),
(UUID(), 'wallet_min_transfer', '5', 'number', 'wallet', 'Minimum transfer amount'),

-- Trade Settings
(UUID(), 'trade_offer_expiry_hours', '72', 'number', 'trades', 'Hours until trade offer expires'),
(UUID(), 'trade_max_wallet_percent', '100', 'number', 'trades', 'Max wallet percentage in trade'),

-- Notification Settings
(UUID(), 'email_notifications_enabled', 'true', 'boolean', 'notifications', 'Enable email notifications'),
(UUID(), 'sms_notifications_enabled', 'false', 'boolean', 'notifications', 'Enable SMS notifications'),

-- Security Settings
(UUID(), 'max_login_attempts', '5', 'number', 'security', 'Max failed login attempts'),
(UUID(), 'lockout_duration_minutes', '30', 'number', 'security', 'Account lockout duration'),
(UUID(), 'session_timeout_hours', '168', 'number', 'security', 'Session timeout in hours'),
(UUID(), 'require_email_verification', 'false', 'boolean', 'security', 'Require email verification'),
(UUID(), 'require_id_verification', 'false', 'boolean', 'security', 'Require ID verification for trading');

-- ==========================================
-- CREATE STORED PROCEDURE FOR DAILY ANALYTICS
-- ==========================================
DELIMITER //

DROP PROCEDURE IF EXISTS calculate_daily_analytics//

CREATE PROCEDURE calculate_daily_analytics(IN target_date DATE)
BEGIN
    DECLARE v_new_users INT DEFAULT 0;
    DECLARE v_active_users INT DEFAULT 0;
    DECLARE v_new_listings INT DEFAULT 0;
    DECLARE v_active_listings INT DEFAULT 0;
    DECLARE v_pending_listings INT DEFAULT 0;
    DECLARE v_total_trades INT DEFAULT 0;
    DECLARE v_completed_trades INT DEFAULT 0;
    DECLARE v_trade_volume DECIMAL(15,2) DEFAULT 0;
    DECLARE v_wallet_topups DECIMAL(15,2) DEFAULT 0;
    DECLARE v_wallet_transfers DECIMAL(15,2) DEFAULT 0;
    DECLARE v_vouchers_redeemed INT DEFAULT 0;
    DECLARE v_voucher_value DECIMAL(15,2) DEFAULT 0;
    DECLARE v_revenue_listing DECIMAL(15,2) DEFAULT 0;
    DECLARE v_revenue_transfer DECIMAL(15,2) DEFAULT 0;
    DECLARE v_reports_created INT DEFAULT 0;
    DECLARE v_reports_resolved INT DEFAULT 0;
    
    -- Calculate metrics
    SELECT COUNT(*) INTO v_new_users FROM users WHERE DATE(created_at) = target_date;
    SELECT COUNT(*) INTO v_active_users FROM users WHERE DATE(last_seen) = target_date;
    SELECT COUNT(*) INTO v_new_listings FROM listings WHERE DATE(created_at) = target_date;
    SELECT COUNT(*) INTO v_active_listings FROM listings WHERE status = 'active' AND DATE(created_at) <= target_date;
    SELECT COUNT(*) INTO v_pending_listings FROM listings WHERE status = 'pending' AND DATE(created_at) = target_date;
    
    SELECT COUNT(*), COALESCE(SUM(wallet_amount), 0) INTO v_total_trades, v_trade_volume 
    FROM trade_offers WHERE DATE(created_at) = target_date;
    
    SELECT COUNT(*) INTO v_completed_trades 
    FROM trade_offers WHERE status = 'accepted' AND DATE(updated_at) = target_date;
    
    SELECT COALESCE(SUM(amount), 0) INTO v_wallet_topups 
    FROM transactions WHERE type = 'topup' AND status = 'completed' AND DATE(created_at) = target_date;
    
    SELECT COALESCE(SUM(amount), 0) INTO v_wallet_transfers 
    FROM transactions WHERE type IN ('transfer_in', 'transfer_out') AND status = 'completed' AND DATE(created_at) = target_date;
    
    SELECT COUNT(*), COALESCE(SUM(amount), 0) INTO v_vouchers_redeemed, v_voucher_value 
    FROM vouchers WHERE status = 'redeemed' AND DATE(redeemed_at) = target_date;
    
    SELECT COALESCE(SUM(fee), 0) INTO v_revenue_listing 
    FROM transactions WHERE type = 'listing_fee' AND status = 'completed' AND DATE(created_at) = target_date;
    
    SELECT COALESCE(SUM(fee), 0) INTO v_revenue_transfer 
    FROM transactions WHERE type IN ('transfer_in', 'transfer_out') AND status = 'completed' AND DATE(created_at) = target_date;
    
    SELECT COUNT(*) INTO v_reports_created FROM reports WHERE DATE(created_at) = target_date;
    SELECT COUNT(*) INTO v_reports_resolved FROM reports WHERE status = 'resolved' AND DATE(reviewed_at) = target_date;
    
    -- Insert or update analytics
    INSERT INTO analytics_daily (
        id, date, new_users, active_users, new_listings, active_listings, pending_listings,
        total_trades, completed_trades, trade_volume, wallet_topups, wallet_transfers,
        vouchers_redeemed, voucher_value, revenue_listing_fees, revenue_transfer_fees, revenue_total,
        reports_created, reports_resolved
    ) VALUES (
        UUID(), target_date, v_new_users, v_active_users, v_new_listings, v_active_listings, v_pending_listings,
        v_total_trades, v_completed_trades, v_trade_volume, v_wallet_topups, v_wallet_transfers,
        v_vouchers_redeemed, v_voucher_value, v_revenue_listing, v_revenue_transfer, 
        v_revenue_listing + v_revenue_transfer, v_reports_created, v_reports_resolved
    )
    ON DUPLICATE KEY UPDATE
        new_users = v_new_users,
        active_users = v_active_users,
        new_listings = v_new_listings,
        active_listings = v_active_listings,
        pending_listings = v_pending_listings,
        total_trades = v_total_trades,
        completed_trades = v_completed_trades,
        trade_volume = v_trade_volume,
        wallet_topups = v_wallet_topups,
        wallet_transfers = v_wallet_transfers,
        vouchers_redeemed = v_vouchers_redeemed,
        voucher_value = v_voucher_value,
        revenue_listing_fees = v_revenue_listing,
        revenue_transfer_fees = v_revenue_transfer,
        revenue_total = v_revenue_listing + v_revenue_transfer,
        reports_created = v_reports_created,
        reports_resolved = v_reports_resolved,
        updated_at = NOW();
END//

DELIMITER ;

-- ==========================================
-- CREATE EVENT FOR DAILY ANALYTICS (requires EVENT_SCHEDULER)
-- ==========================================
-- Note: Enable event scheduler with: SET GLOBAL event_scheduler = ON;
-- Or add event_scheduler=ON to my.cnf

DROP EVENT IF EXISTS daily_analytics_calculation;

CREATE EVENT IF NOT EXISTS daily_analytics_calculation
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 1 HOUR)
DO
    CALL calculate_daily_analytics(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY));

-- ==========================================
-- TRIGGERS FOR ACTIVITY LOGGING
-- ==========================================

-- User registration trigger
DROP TRIGGER IF EXISTS log_user_register;
DELIMITER //
CREATE TRIGGER log_user_register AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO activity_log (id, user_id, type, action, entity_type, entity_id, description, new_values)
    VALUES (
        UUID(),
        NEW.id,
        'user_register',
        'User registered',
        'user',
        NEW.id,
        CONCAT('New user registered: ', NEW.name, ' (', NEW.email, ')'),
        JSON_OBJECT('name', NEW.name, 'email', NEW.email, 'region', NEW.region)
    );
END//
DELIMITER ;

-- Listing creation trigger
DROP TRIGGER IF EXISTS log_listing_create;
DELIMITER //
CREATE TRIGGER log_listing_create AFTER INSERT ON listings
FOR EACH ROW
BEGIN
    INSERT INTO activity_log (id, user_id, type, action, entity_type, entity_id, description, new_values)
    VALUES (
        UUID(),
        NEW.user_id,
        'listing_create',
        'Listing created',
        'listing',
        NEW.id,
        CONCAT('New listing: ', NEW.title),
        JSON_OBJECT('title', NEW.title, 'value', NEW.value, 'status', NEW.status, 'category_id', NEW.category_id)
    );
END//
DELIMITER ;

-- Trade offer trigger
DROP TRIGGER IF EXISTS log_trade_create;
DELIMITER //
CREATE TRIGGER log_trade_create AFTER INSERT ON trade_offers
FOR EACH ROW
BEGIN
    INSERT INTO activity_log (id, user_id, type, action, entity_type, entity_id, description, new_values)
    VALUES (
        UUID(),
        NEW.sender_id,
        'trade_create',
        'Trade offer created',
        'trade',
        NEW.id,
        CONCAT('Trade offer sent to user ', NEW.receiver_id),
        JSON_OBJECT('sender_id', NEW.sender_id, 'receiver_id', NEW.receiver_id, 'wallet_amount', NEW.wallet_amount)
    );
END//
DELIMITER ;

-- Transaction trigger
DROP TRIGGER IF EXISTS log_transaction;
DELIMITER //
CREATE TRIGGER log_transaction AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE v_type VARCHAR(50);
    SET v_type = CONCAT('wallet_', NEW.type);
    
    INSERT INTO activity_log (id, user_id, type, action, entity_type, entity_id, description, new_values)
    VALUES (
        UUID(),
        NEW.user_id,
        CASE 
            WHEN NEW.type = 'topup' THEN 'wallet_topup'
            WHEN NEW.type IN ('transfer_in', 'transfer_out') THEN 'wallet_transfer'
            WHEN NEW.type = 'voucher' THEN 'wallet_voucher'
            ELSE 'wallet_adjust'
        END,
        CONCAT('Transaction: ', NEW.type),
        'transaction',
        NEW.id,
        CONCAT('Amount: N$', NEW.amount, ', Type: ', NEW.type),
        JSON_OBJECT('type', NEW.type, 'amount', NEW.amount, 'status', NEW.status, 'balance_after', NEW.balance_after)
    );
END//
DELIMITER ;

-- Report trigger
DROP TRIGGER IF EXISTS log_report_create;
DELIMITER //
CREATE TRIGGER log_report_create AFTER INSERT ON reports
FOR EACH ROW
BEGIN
    INSERT INTO activity_log (id, user_id, type, action, entity_type, entity_id, description, new_values)
    VALUES (
        UUID(),
        NEW.reporter_id,
        'report_create',
        'Report submitted',
        'report',
        NEW.id,
        CONCAT('Report on ', NEW.reported_type, ' for: ', NEW.reason),
        JSON_OBJECT('reported_type', NEW.reported_type, 'reported_id', NEW.reported_id, 'reason', NEW.reason)
    );
END//
DELIMITER ;

-- ==========================================
-- VIEWS FOR ADMIN DASHBOARD
-- ==========================================

-- Dashboard overview stats
CREATE OR REPLACE VIEW v_admin_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM users WHERE is_banned = FALSE) as total_users,
    (SELECT COUNT(*) FROM users WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as active_users_week,
    (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) as new_users_today,
    (SELECT COUNT(*) FROM listings WHERE status = 'active') as active_listings,
    (SELECT COUNT(*) FROM listings WHERE status = 'pending') as pending_listings,
    (SELECT COUNT(*) FROM listings WHERE status = 'flagged') as flagged_listings,
    (SELECT COUNT(*) FROM trade_offers WHERE status = 'pending') as pending_trades,
    (SELECT COUNT(*) FROM trade_offers WHERE status = 'accepted') as completed_trades,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'completed') as total_transaction_volume,
    (SELECT COALESCE(SUM(fee), 0) FROM transactions WHERE status = 'completed') as total_revenue,
    (SELECT COUNT(*) FROM vouchers WHERE status = 'available') as available_vouchers,
    (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
    (SELECT COUNT(*) FROM topup_requests WHERE status = 'pending') as pending_topups;

-- User activity summary
CREATE OR REPLACE VIEW v_user_activity_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.region,
    u.role,
    u.is_banned,
    u.wallet_balance,
    u.last_seen,
    u.created_at,
    (SELECT COUNT(*) FROM listings WHERE user_id = u.id) as listing_count,
    (SELECT COUNT(*) FROM trade_offers WHERE sender_id = u.id OR receiver_id = u.id) as trade_count,
    (SELECT COUNT(*) FROM transactions WHERE user_id = u.id) as transaction_count,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = u.id AND type = 'topup' AND status = 'completed') as total_topups
FROM users u;

-- Recent activity feed
-- Note: This view requires the activity_log table to be created first (above)
-- If you get an error about missing 'type' column, ensure you ran this script from the beginning
DROP VIEW IF EXISTS v_recent_activity;
CREATE VIEW v_recent_activity AS
SELECT 
    id,
    user_id,
    type,
    action,
    entity_type,
    entity_id,
    description,
    metadata,
    created_at
FROM activity_log
ORDER BY created_at DESC
LIMIT 100;

SELECT 'Admin dashboard enhancement complete!' as message;
