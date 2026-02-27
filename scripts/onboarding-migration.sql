-- Onboarding System Migration
-- This script adds onboarding tracking to users and creates the user_preferences table

-- Add onboarding columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS bio TEXT NULL,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) NULL;

-- Create user_preferences table for storing user interests and settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  interests JSON DEFAULT NULL,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  dark_mode BOOLEAN DEFAULT FALSE,
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(10) DEFAULT 'NAD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);

-- Insert default preferences for existing users who don't have them
INSERT INTO user_preferences (id, user_id)
SELECT 
  CONCAT('pref_', SUBSTRING(MD5(RAND()) FROM 1 FOR 20)),
  u.id
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id
WHERE up.id IS NULL;
