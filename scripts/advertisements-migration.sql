-- Advertisements System Migration for Barter Trade Namibia
-- Supports Paid and Sponsored Adverts with full client management

-- Drop existing table if needed (careful in production)
-- DROP TABLE IF EXISTS advertisements;

-- Create advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    position ENUM('hero', 'sidebar', 'feed', 'banner') NOT NULL DEFAULT 'banner',
    ad_type ENUM('paid', 'sponsored') NOT NULL DEFAULT 'sponsored',
    status ENUM('active', 'inactive', 'scheduled', 'expired') NOT NULL DEFAULT 'inactive',
    start_date DATETIME,
    end_date DATETIME,
    impressions INT UNSIGNED DEFAULT 0,
    clicks INT UNSIGNED DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Paid advertisement client details
    business_name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(500),
    
    -- Pricing and billing
    duration_type ENUM('daily', 'weekly', 'monthly'),
    duration_days INT,
    pricing_package VARCHAR(100),
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_status ENUM('pending', 'paid', 'overdue', 'refunded'),
    
    -- Invoice and quotation tracking
    invoice_number VARCHAR(50),
    quotation_sent_at DATETIME,
    invoice_sent_at DATETIME,
    reminder_sent_at DATETIME,
    
    -- Indexes for performance
    INDEX idx_ad_status (status),
    INDEX idx_ad_type (ad_type),
    INDEX idx_ad_position (position),
    INDEX idx_ad_dates (start_date, end_date),
    INDEX idx_payment_status (payment_status),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create onboarding tracking table
CREATE TABLE IF NOT EXISTS user_onboarding (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    
    -- Onboarding steps completed
    personal_details_confirmed BOOLEAN DEFAULT FALSE,
    profile_picture_uploaded BOOLEAN DEFAULT FALSE,
    id_document_uploaded BOOLEAN DEFAULT FALSE,
    interests_selected BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Data from onboarding
    selected_interests JSON,
    
    -- Tracking dates
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    last_prompt_at DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create reports table if not exists
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    reporter_id VARCHAR(36) NOT NULL,
    reported_id VARCHAR(36),
    reported_type ENUM('user', 'listing', 'message') NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by VARCHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_report_status (status),
    INDEX idx_reported_type (reported_type),
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create listing_reports table for backward compatibility
CREATE TABLE IF NOT EXISTS listing_reports (
    id VARCHAR(36) PRIMARY KEY,
    listing_id VARCHAR(36) NOT NULL,
    reporter_id VARCHAR(36) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by VARCHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_listing_report_status (status),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new fields to users table if not exist
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS street_address VARCHAR(500),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Namibia',
    ADD COLUMN IF NOT EXISTS id_verified_at DATETIME,
    ADD COLUMN IF NOT EXISTS id_verified_by VARCHAR(36);

-- Create ID verification requests table
CREATE TABLE IF NOT EXISTS id_verification_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    national_id_front VARCHAR(500) NOT NULL,
    national_id_back VARCHAR(500) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by VARCHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_verification_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create trade_offers table if not exists
CREATE TABLE IF NOT EXISTS trade_offers (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36),
    conversation_id VARCHAR(36),
    wallet_amount DECIMAL(10, 2) DEFAULT 0.00,
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'countered', 'expired', 'cancelled') DEFAULT 'pending',
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_offer_status (status),
    INDEX idx_offer_sender (sender_id),
    INDEX idx_offer_receiver (receiver_id),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create topup_requests table if not exists
CREATE TABLE IF NOT EXISTS topup_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    bank VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    receipt_url VARCHAR(500) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    voucher_code VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    processed_by VARCHAR(36),
    
    INDEX idx_topup_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    admin_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    action_type VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    description TEXT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_action (action),
    INDEX idx_activity_entity (entity_type, entity_id),
    INDEX idx_activity_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create conversations table if not exists
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY,
    listing_id VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_conv_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_participant (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('text', 'image', 'offer', 'system') DEFAULT 'text',
    offer_id VARCHAR(36),
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_msg_conversation (conversation_id),
    INDEX idx_msg_sender (sender_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scheduled job to check ad expiry and send reminders (run daily via cron)
-- This would be handled by a scheduled task in the application

DELIMITER //

CREATE EVENT IF NOT EXISTS check_ad_expiry
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Mark expired ads as inactive
    UPDATE advertisements 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND end_date IS NOT NULL 
    AND end_date < NOW();
    
    -- Update reminder_sent_at for ads expiring in 3 days (handle notification in app)
    UPDATE advertisements 
    SET reminder_sent_at = NOW()
    WHERE status = 'active' 
    AND ad_type = 'paid'
    AND end_date IS NOT NULL 
    AND end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
    AND (reminder_sent_at IS NULL OR reminder_sent_at < DATE_SUB(NOW(), INTERVAL 3 DAY));
END //

DELIMITER ;

-- Insert sample sponsored advertisement for testing
INSERT IGNORE INTO advertisements (
    id, title, description, image_url, link_url, position, ad_type, status,
    created_by, created_at, updated_at
) VALUES (
    'ad_sample_001',
    'Welcome to Barter Trade Namibia',
    'Trade anything, anywhere in Namibia. Join thousands of traders today!',
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=1200&h=400&fit=crop',
    '/auth',
    'hero',
    'sponsored',
    'active',
    'admin-001',
    NOW(),
    NOW()
);
