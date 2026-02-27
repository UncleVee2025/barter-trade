-- User Onboarding Migration Script
-- Barter Trade Namibia - Production Database
-- This script creates the user_onboarding table required for the onboarding flow

USE barter_trade;

-- ==========================================
-- USER ONBOARDING TABLE
-- Tracks user onboarding progress and preferences
-- ==========================================
CREATE TABLE IF NOT EXISTS user_onboarding (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    personal_details_confirmed BOOLEAN DEFAULT FALSE,
    profile_picture_uploaded BOOLEAN DEFAULT FALSE,
    id_document_uploaded BOOLEAN DEFAULT FALSE,
    interests_selected BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    selected_interests JSON DEFAULT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,
    last_prompt_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_completed (onboarding_completed),
    INDEX idx_started (started_at)
) ENGINE=InnoDB;

-- ==========================================
-- ADD ONBOARDING COLUMN TO USERS TABLE
-- Quick flag to check if user needs onboarding
-- ==========================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;

-- ==========================================
-- CREATE VIEW FOR DASHBOARD STATS
-- Aggregates platform statistics for real-time display
-- ==========================================
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE is_banned = FALSE) as total_users,
    (SELECT COUNT(*) FROM listings WHERE status = 'active') as active_listings,
    (SELECT COUNT(*) FROM trade_offers WHERE status = 'accepted') as completed_trades,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'topup' AND status = 'completed') as total_topups,
    (SELECT COUNT(*) FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_users_week,
    (SELECT COUNT(*) FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)) as new_users_today,
    (SELECT COUNT(*) FROM trade_offers WHERE status = 'accepted' AND DATE(updated_at) = CURDATE()) as trades_today,
    (SELECT COUNT(*) FROM users WHERE last_seen > DATE_SUB(NOW(), INTERVAL 15 MINUTE)) as online_now;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT 'User onboarding migration completed successfully!' AS status;
