-- Verification Tables Migration for Barter Trade Namibia
-- This creates tables for email and phone verification with OTP codes

-- Email Verifications Table
CREATE TABLE IF NOT EXISTS email_verifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  attempts INT DEFAULT 0,
  used BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_verifications_user (user_id),
  INDEX idx_email_verifications_code (code),
  INDEX idx_email_verifications_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phone Verifications Table
CREATE TABLE IF NOT EXISTS phone_verifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  attempts INT DEFAULT 0,
  used BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_phone_verifications_user (user_id),
  INDEX idx_phone_verifications_code (code),
  INDEX idx_phone_verifications_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ID Verification Requests Table (if not exists)
CREATE TABLE IF NOT EXISTS id_verification_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  national_id_front VARCHAR(500) NOT NULL,
  national_id_back VARCHAR(500) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  admin_id VARCHAR(36) NULL,
  rejection_reason TEXT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_id_verification_user (user_id),
  INDEX idx_id_verification_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add verification columns to users table if not exist
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS national_id_front VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS national_id_back VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS id_verification_status ENUM('not_submitted', 'pending', 'approved', 'rejected') DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS id_rejection_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMP NULL;

-- Reports Table (if not exists)
CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(36) PRIMARY KEY,
  reporter_id VARCHAR(36) NOT NULL,
  reported_id VARCHAR(36) NULL,
  reported_type ENUM('user', 'listing', 'message', 'comment') NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  reason ENUM('spam', 'inappropriate', 'scam', 'harassment', 'other') NOT NULL,
  description TEXT NULL,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
  admin_id VARCHAR(36) NULL,
  admin_notes TEXT NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reports_status (status),
  INDEX idx_reports_type (reported_type),
  INDEX idx_reports_reporter (reporter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Log Table (if not exists)
CREATE TABLE IF NOT EXISTS activity_log (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id VARCHAR(36) NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_user (user_id),
  INDEX idx_activity_action (action),
  INDEX idx_activity_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cleanup old verification records (run periodically)
-- DELETE FROM email_verifications WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
-- DELETE FROM phone_verifications WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
