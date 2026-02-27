-- ================================================================
-- BARTER TRADE NAMIBIA - COMPLETE DATABASE SCHEMA
-- Created: 2026
-- Platform: MySQL 8.0+
-- Character Set: utf8mb4 (supports emojis and special characters)
-- ================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ================================================================
-- 1. USERS TABLE - Core user accounts
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  gender ENUM('male', 'female', 'other'),
  date_of_birth DATE,
  region VARCHAR(50) NOT NULL DEFAULT 'Khomas',
  town VARCHAR(100),
  street_address VARCHAR(255),
  postal_code VARCHAR(20),
  avatar VARCHAR(500),
  bio TEXT,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,
  id_verification_status ENUM('not_submitted', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'not_submitted',
  id_rejection_reason TEXT,
  national_id_front VARCHAR(500),
  national_id_back VARCHAR(500),
  email_verified_at TIMESTAMP NULL,
  phone_verified_at TIMESTAMP NULL,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  qr_code VARCHAR(20) UNIQUE,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_users_email (email),
  INDEX idx_users_region (region),
  INDEX idx_users_role (role),
  INDEX idx_users_qr_code (qr_code),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 2. SESSIONS TABLE - User authentication sessions
-- ================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_token (token(255)),
  INDEX idx_sessions_expires_at (expires_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 3. CATEGORIES TABLE - Listing categories
-- ================================================================
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50) NOT NULL DEFAULT 'Package',
  color VARCHAR(20) DEFAULT '#ea580c',
  description TEXT,
  image VARCHAR(500),
  listing_count INT NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_is_active (is_active),
  INDEX idx_categories_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 4. SUBCATEGORIES TABLE - Listing subcategories
-- ================================================================
CREATE TABLE IF NOT EXISTS subcategories (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_subcategories_category_id (category_id),
  INDEX idx_subcategories_slug (slug),
  
  UNIQUE KEY unique_subcat_slug (category_id, slug),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 5. LISTINGS TABLE - Items and services for trade
-- ================================================================
CREATE TABLE IF NOT EXISTS listings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_id VARCHAR(36) NOT NULL,
  subcategory_id VARCHAR(36),
  type ENUM('item', 'service') NOT NULL DEFAULT 'item',
  value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
  `condition` ENUM('new', 'like_new', 'good', 'fair', 'poor') DEFAULT 'good',
  region VARCHAR(50) NOT NULL,
  town VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status ENUM('pending', 'active', 'sold', 'flagged', 'expired', 'draft') NOT NULL DEFAULT 'pending',
  views INT NOT NULL DEFAULT 0,
  saves INT NOT NULL DEFAULT 0,
  likes INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  featured_until TIMESTAMP NULL,
  trade_preferences TEXT,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_listings_user_id (user_id),
  INDEX idx_listings_category_id (category_id),
  INDEX idx_listings_status (status),
  INDEX idx_listings_region (region),
  INDEX idx_listings_featured (featured),
  INDEX idx_listings_created_at (created_at),
  INDEX idx_listings_value (value),
  FULLTEXT INDEX idx_listings_search (title, description),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 6. LISTING_IMAGES TABLE - Images for listings
-- ================================================================
CREATE TABLE IF NOT EXISTS listing_images (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_listing_images_listing_id (listing_id),
  INDEX idx_listing_images_is_primary (is_primary),
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 7. LISTING_WANTED_ITEMS TABLE - Items user wants in exchange
-- ================================================================
CREATE TABLE IF NOT EXISTS listing_wanted_items (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  description VARCHAR(255) NOT NULL,
  category_id VARCHAR(36),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_listing_wanted_items_listing_id (listing_id),
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 8. SAVED_LISTINGS TABLE - User's saved/bookmarked listings
-- ================================================================
CREATE TABLE IF NOT EXISTS saved_listings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  listing_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_saved_listing (user_id, listing_id),
  INDEX idx_saved_listings_user_id (user_id),
  INDEX idx_saved_listings_listing_id (listing_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 9. LISTING_LIKES TABLE - User likes on listings
-- ================================================================
CREATE TABLE IF NOT EXISTS listing_likes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  listing_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_listing_like (user_id, listing_id),
  INDEX idx_listing_likes_listing_id (listing_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 10. LISTING_COMMENTS TABLE - Comments on listings
-- ================================================================
CREATE TABLE IF NOT EXISTS listing_comments (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  parent_id VARCHAR(36),
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_listing_comments_listing_id (listing_id),
  INDEX idx_listing_comments_user_id (user_id),
  INDEX idx_listing_comments_parent_id (parent_id),
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES listing_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 11. CONVERSATIONS TABLE - Chat conversations
-- ================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_conversations_listing_id (listing_id),
  INDEX idx_conversations_updated_at (updated_at),
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 12. CONVERSATION_PARTICIPANTS TABLE - Users in a conversation
-- ================================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  last_read_at TIMESTAMP NULL,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_conversation_participant (conversation_id, user_id),
  INDEX idx_conversation_participants_user_id (user_id),
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 13. MESSAGES TABLE - Chat messages
-- ================================================================
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('text', 'image', 'offer', 'system') NOT NULL DEFAULT 'text',
  offer_id VARCHAR(36),
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_messages_conversation_id (conversation_id),
  INDEX idx_messages_sender_id (sender_id),
  INDEX idx_messages_created_at (created_at),
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 14. TRADE_OFFERS TABLE - Trade offers between users
-- ================================================================
CREATE TABLE IF NOT EXISTS trade_offers (
  id VARCHAR(36) PRIMARY KEY,
  sender_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  conversation_id VARCHAR(36),
  listing_id VARCHAR(36),
  wallet_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  message TEXT,
  status ENUM('pending', 'accepted', 'rejected', 'countered', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_trade_offers_sender_id (sender_id),
  INDEX idx_trade_offers_receiver_id (receiver_id),
  INDEX idx_trade_offers_listing_id (listing_id),
  INDEX idx_trade_offers_status (status),
  INDEX idx_trade_offers_created_at (created_at),
  
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 15. TRADE_OFFER_ITEMS TABLE - Items included in trade offers
-- ================================================================
CREATE TABLE IF NOT EXISTS trade_offer_items (
  id VARCHAR(36) PRIMARY KEY,
  trade_offer_id VARCHAR(36) NOT NULL,
  listing_id VARCHAR(36) NOT NULL,
  owner_type ENUM('sender', 'receiver') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_trade_offer_items_trade_offer_id (trade_offer_id),
  INDEX idx_trade_offer_items_listing_id (listing_id),
  
  FOREIGN KEY (trade_offer_id) REFERENCES trade_offers(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 16. TRANSACTIONS TABLE - Wallet transactions
-- ================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('topup', 'transfer_in', 'transfer_out', 'listing_fee', 'featured_fee', 'offer_fee', 'voucher', 'trade', 'refund', 'withdrawal') NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  balance_after DECIMAL(12, 2) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  reference VARCHAR(100),
  description TEXT,
  related_user_id VARCHAR(36),
  related_listing_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_transactions_user_id (user_id),
  INDEX idx_transactions_type (type),
  INDEX idx_transactions_status (status),
  INDEX idx_transactions_created_at (created_at),
  INDEX idx_transactions_related_user_id (related_user_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (related_listing_id) REFERENCES listings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 17. VOUCHERS TABLE - Prepaid voucher codes
-- ================================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  amount DECIMAL(12, 2) NOT NULL,
  type ENUM('scratch', 'online') NOT NULL DEFAULT 'scratch',
  status ENUM('unused', 'used', 'disabled', 'expired', 'exported') NOT NULL DEFAULT 'unused',
  vendor VARCHAR(100),
  batch_id VARCHAR(36),
  created_by VARCHAR(36) NOT NULL,
  used_by VARCHAR(36),
  used_by_phone VARCHAR(20),
  used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_vouchers_code (code),
  INDEX idx_vouchers_status (status),
  INDEX idx_vouchers_batch_id (batch_id),
  INDEX idx_vouchers_created_by (created_by),
  INDEX idx_vouchers_expires_at (expires_at),
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 18. VOUCHER_BATCHES TABLE - Voucher batch management
-- ================================================================
CREATE TABLE IF NOT EXISTS voucher_batches (
  id VARCHAR(36) PRIMARY KEY,
  batch_number VARCHAR(50) NOT NULL UNIQUE,
  total_count INT NOT NULL DEFAULT 0,
  used_count INT NOT NULL DEFAULT 0,
  total_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  denomination DECIMAL(12, 2) NOT NULL,
  vendor VARCHAR(100),
  notes TEXT,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_voucher_batches_batch_number (batch_number),
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 19. TOPUP_REQUESTS TABLE - Mobile money top-up requests
-- ================================================================
CREATE TABLE IF NOT EXISTS topup_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  bank VARCHAR(50) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  receipt_url VARCHAR(500) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  voucher_code VARCHAR(20),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  processed_by VARCHAR(36),
  
  INDEX idx_topup_requests_user_id (user_id),
  INDEX idx_topup_requests_status (status),
  INDEX idx_topup_requests_created_at (created_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 20. NOTIFICATIONS TABLE - User notifications
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('trade', 'message', 'wallet', 'listing', 'system', 'offer', 'review') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_type (type),
  INDEX idx_notifications_is_read (is_read),
  INDEX idx_notifications_created_at (created_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 21. REPORTS TABLE - User/listing reports
-- ================================================================
CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(36) PRIMARY KEY,
  reporter_id VARCHAR(36) NOT NULL,
  reported_type ENUM('listing', 'user', 'message') NOT NULL,
  reported_id VARCHAR(36) NOT NULL,
  reason ENUM('spam', 'fraud', 'inappropriate', 'counterfeit', 'wrong_category', 'harassment', 'other') NOT NULL,
  description TEXT,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_reports_reporter_id (reporter_id),
  INDEX idx_reports_reported_type (reported_type),
  INDEX idx_reports_reported_id (reported_id),
  INDEX idx_reports_status (status),
  INDEX idx_reports_created_at (created_at),
  
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 22. USER_REVIEWS TABLE - User-to-user reviews after trades
-- ================================================================
CREATE TABLE IF NOT EXISTS user_reviews (
  id VARCHAR(36) PRIMARY KEY,
  reviewer_id VARCHAR(36) NOT NULL,
  reviewed_user_id VARCHAR(36) NOT NULL,
  trade_offer_id VARCHAR(36),
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_reviews_reviewer_id (reviewer_id),
  INDEX idx_user_reviews_reviewed_user_id (reviewed_user_id),
  INDEX idx_user_reviews_trade_offer_id (trade_offer_id),
  INDEX idx_user_reviews_rating (rating),
  
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trade_offer_id) REFERENCES trade_offers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 23. USER_GAMIFICATION TABLE - Points, tiers, badges
-- ================================================================
CREATE TABLE IF NOT EXISTS user_gamification (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  total_points INT NOT NULL DEFAULT 0,
  tier ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond') NOT NULL DEFAULT 'bronze',
  star_rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  total_reviews INT NOT NULL DEFAULT 0,
  profile_completion_percent INT NOT NULL DEFAULT 0,
  verified_trader BOOLEAN NOT NULL DEFAULT FALSE,
  badges JSON DEFAULT '[]',
  achievements JSON DEFAULT '[]',
  points_history JSON DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_gamification_user_id (user_id),
  INDEX idx_user_gamification_tier (tier),
  INDEX idx_user_gamification_total_points (total_points),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 24. BADGES TABLE - Available badges
-- ================================================================
CREATE TABLE IF NOT EXISTS badges (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#ea580c',
  tier_required ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond'),
  points_required INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 25. ACHIEVEMENTS TABLE - Available achievements
-- ================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#ea580c',
  points_reward INT NOT NULL DEFAULT 0,
  criteria JSON,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 26. USER_ACHIEVEMENTS TABLE - Earned achievements
-- ================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  achievement_id VARCHAR(36) NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_achievement (user_id, achievement_id),
  INDEX idx_user_achievements_user_id (user_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 27. POINT_TRANSACTIONS TABLE - Points history
-- ================================================================
CREATE TABLE IF NOT EXISTS point_transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  points INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  description TEXT,
  balance_after INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_point_transactions_user_id (user_id),
  INDEX idx_point_transactions_action_type (action_type),
  INDEX idx_point_transactions_created_at (created_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 28. ADVERTISEMENTS TABLE - Platform advertisements
-- ================================================================
CREATE TABLE IF NOT EXISTS advertisements (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  cta_text VARCHAR(50) NOT NULL DEFAULT 'Learn More',
  gradient_colors VARCHAR(100) DEFAULT 'from-primary via-amber-500 to-primary',
  placement ENUM('banner', 'sidebar', 'listing_feed', 'featured', 'home-banner', 'home-sidebar') NOT NULL DEFAULT 'banner',
  position VARCHAR(50),
  priority INT NOT NULL DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_advertisements_placement (placement),
  INDEX idx_advertisements_is_active (is_active),
  INDEX idx_advertisements_start_date (start_date),
  INDEX idx_advertisements_end_date (end_date),
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 29. WAITLIST TABLE - Pre-launch waitlist
-- ================================================================
CREATE TABLE IF NOT EXISTS waitlist (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  position INT NOT NULL AUTO_INCREMENT UNIQUE,
  source VARCHAR(50) DEFAULT 'website',
  referral_code VARCHAR(20),
  referred_by VARCHAR(36),
  status ENUM('waiting', 'invited', 'joined') NOT NULL DEFAULT 'waiting',
  invited_at TIMESTAMP NULL,
  joined_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_waitlist_email (email),
  INDEX idx_waitlist_status (status),
  INDEX idx_waitlist_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 30. SYSTEM_SETTINGS TABLE - Platform configuration
-- ================================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id VARCHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_system_settings_key (setting_key),
  INDEX idx_system_settings_category (category),
  
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 31. ACTIVITY_LOG TABLE - Admin activity logging
-- ================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id VARCHAR(36) PRIMARY KEY,
  admin_id VARCHAR(36),
  user_id VARCHAR(36),
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(36),
  description TEXT,
  metadata JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_activity_log_admin_id (admin_id),
  INDEX idx_activity_log_user_id (user_id),
  INDEX idx_activity_log_action_type (action_type),
  INDEX idx_activity_log_entity_type (entity_type),
  INDEX idx_activity_log_created_at (created_at),
  
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 32. PASSWORD_RESET_TOKENS TABLE - Password reset requests
-- ================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_password_reset_tokens_token (token),
  INDEX idx_password_reset_tokens_user_id (user_id),
  INDEX idx_password_reset_tokens_expires_at (expires_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 33. USER_BLOCKS TABLE - User blocking
-- ================================================================
CREATE TABLE IF NOT EXISTS user_blocks (
  id VARCHAR(36) PRIMARY KEY,
  blocker_id VARCHAR(36) NOT NULL,
  blocked_id VARCHAR(36) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_block (blocker_id, blocked_id),
  INDEX idx_user_blocks_blocker_id (blocker_id),
  INDEX idx_user_blocks_blocked_id (blocked_id),
  
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 34. USER_FOLLOWS TABLE - User following system
-- ================================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id VARCHAR(36) PRIMARY KEY,
  follower_id VARCHAR(36) NOT NULL,
  following_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_follow (follower_id, following_id),
  INDEX idx_user_follows_follower_id (follower_id),
  INDEX idx_user_follows_following_id (following_id),
  
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 35. LISTING_VIEWS TABLE - Track listing view history
-- ================================================================
CREATE TABLE IF NOT EXISTS listing_views (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  ip_address VARCHAR(45),
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_listing_views_listing_id (listing_id),
  INDEX idx_listing_views_user_id (user_id),
  INDEX idx_listing_views_viewed_at (viewed_at),
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- INSERT DEFAULT DATA
-- ================================================================

-- Default Categories
INSERT INTO categories (id, name, slug, icon, color, description, display_order, is_active) VALUES
('cat-electronics', 'Electronics', 'electronics', 'Smartphone', '#3b82f6', 'Phones, computers, gadgets and electronic devices', 1, TRUE),
('cat-vehicles', 'Vehicles', 'vehicles', 'Car', '#ef4444', 'Cars, motorcycles, trucks and vehicle parts', 2, TRUE),
('cat-home', 'Home & Garden', 'home', 'Home', '#22c55e', 'Furniture, appliances, decor and garden items', 3, TRUE),
('cat-fashion', 'Fashion', 'fashion', 'Shirt', '#a855f7', 'Clothing, shoes, accessories and jewelry', 4, TRUE),
('cat-sports', 'Sports & Leisure', 'sports', 'Dumbbell', '#f59e0b', 'Sports equipment, outdoor gear and hobbies', 5, TRUE),
('cat-services', 'Services', 'services', 'Wrench', '#06b6d4', 'Professional services, repairs and skills', 6, TRUE),
('cat-livestock', 'Livestock', 'livestock', 'Beef', '#78716c', 'Cattle, goats, poultry and farm animals', 7, TRUE),
('cat-agriculture', 'Agriculture', 'agriculture', 'Wheat', '#84cc16', 'Farming equipment, seeds, produce and supplies', 8, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Default System Settings
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_public) VALUES
('set-001', 'site_name', 'Barter Trade Namibia', 'string', 'general', 'Platform name', TRUE),
('set-002', 'site_description', 'Namibia''s Premier Trade & Barter Platform', 'string', 'general', 'Platform description', TRUE),
('set-003', 'maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode', FALSE),
('set-004', 'allow_registrations', 'true', 'boolean', 'general', 'Allow new user registrations', FALSE),
('set-005', 'max_images_per_listing', '10', 'number', 'listings', 'Maximum images per listing', FALSE),
('set-006', 'require_approval', 'false', 'boolean', 'listings', 'Require admin approval for listings', FALSE),
('set-007', 'listing_expiry_days', '90', 'number', 'listings', 'Days until listing expires', FALSE),
('set-008', 'featured_listing_fee', '50', 'number', 'listings', 'Fee for featuring a listing (NAD)', FALSE),
('set-009', 'min_topup_amount', '10', 'number', 'wallet', 'Minimum wallet top-up (NAD)', FALSE),
('set-010', 'max_topup_amount', '10000', 'number', 'wallet', 'Maximum wallet top-up (NAD)', FALSE),
('set-011', 'transfer_fee_percentage', '0', 'number', 'wallet', 'Transfer fee percentage', FALSE),
('set-012', 'min_transfer_amount', '5', 'number', 'wallet', 'Minimum transfer amount (NAD)', FALSE),
('set-013', 'require_id_for_trade', 'true', 'boolean', 'verification', 'Require ID verification for trading', FALSE),
('set-014', 'require_id_for_withdraw', 'true', 'boolean', 'verification', 'Require ID verification for withdrawals', FALSE),
('set-015', 'email_notifications', 'true', 'boolean', 'notifications', 'Enable email notifications', FALSE),
('set-016', 'sms_notifications', 'false', 'boolean', 'notifications', 'Enable SMS notifications', FALSE)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Default Badges
INSERT INTO badges (id, name, slug, description, icon, color, tier_required, points_required, is_active) VALUES
('badge-001', 'New Trader', 'new-trader', 'Welcome to the platform!', 'Star', '#22c55e', NULL, 0, TRUE),
('badge-002', 'First Trade', 'first-trade', 'Completed your first trade', 'HandshakeIcon', '#3b82f6', NULL, 10, TRUE),
('badge-003', 'Verified', 'verified', 'ID verification completed', 'Shield', '#8b5cf6', NULL, NULL, TRUE),
('badge-004', 'Top Trader', 'top-trader', 'Completed 50+ trades', 'Trophy', '#f59e0b', 'gold', 200, TRUE),
('badge-005', 'Elite Member', 'elite-member', 'Reached platinum tier', 'Crown', '#ec4899', 'platinum', 300, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Default Achievements
INSERT INTO achievements (id, name, slug, description, icon, color, points_reward, is_active) VALUES
('ach-001', 'First Listing', 'first-listing', 'Created your first listing', 'Package', '#22c55e', 10, TRUE),
('ach-002', 'Trade Master', 'trade-master', 'Completed 10 successful trades', 'Handshake', '#3b82f6', 50, TRUE),
('ach-003', 'Wallet Funded', 'wallet-funded', 'Added funds to your wallet', 'Wallet', '#f59e0b', 5, TRUE),
('ach-004', 'Profile Complete', 'profile-complete', 'Completed your profile 100%', 'User', '#8b5cf6', 15, TRUE),
('ach-005', 'Community Star', 'community-star', 'Received 10 five-star reviews', 'Star', '#ec4899', 100, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ================================================================
-- DONE! Database schema created successfully.
-- ================================================================
