-- User Settings Migration for Barter Trade Namibia
-- This creates a table to store user preferences and settings
-- Column names match the API in /app/api/user/settings/route.ts

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  
  -- Notification settings (matching API column names)
  notification_email TINYINT(1) DEFAULT 1,
  notification_push TINYINT(1) DEFAULT 1,
  notification_new_offers TINYINT(1) DEFAULT 1,
  notification_messages TINYINT(1) DEFAULT 1,
  notification_price_drops TINYINT(1) DEFAULT 0,
  notification_weekly_digest TINYINT(1) DEFAULT 1,
  
  -- Privacy settings (matching API column names)
  privacy_show_online_status TINYINT(1) DEFAULT 1,
  privacy_show_location TINYINT(1) DEFAULT 1,
  privacy_allow_messages TINYINT(1) DEFAULT 1,
  
  -- Appearance settings
  theme VARCHAR(20) DEFAULT 'system',
  language VARCHAR(10) DEFAULT 'en',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Unique constraint - one settings record per user
  UNIQUE KEY unique_user_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for faster lookups
CREATE INDEX idx_user_settings_user ON user_settings(user_id);
