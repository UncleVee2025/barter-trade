-- User Settings Table Migration
-- Run this migration to add user settings storage

-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
  user_id VARCHAR(36) PRIMARY KEY,
  
  -- Notification preferences
  notification_email BOOLEAN DEFAULT TRUE,
  notification_push BOOLEAN DEFAULT TRUE,
  notification_new_offers BOOLEAN DEFAULT TRUE,
  notification_messages BOOLEAN DEFAULT TRUE,
  notification_price_drops BOOLEAN DEFAULT FALSE,
  notification_weekly_digest BOOLEAN DEFAULT TRUE,
  
  -- Privacy settings
  privacy_show_online_status BOOLEAN DEFAULT TRUE,
  privacy_show_location BOOLEAN DEFAULT TRUE,
  privacy_allow_messages BOOLEAN DEFAULT TRUE,
  
  -- Other preferences
  language VARCHAR(10) DEFAULT 'en',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Migration complete message
SELECT 'User settings table created successfully' as status;
