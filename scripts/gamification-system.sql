-- Gamification System Migration
-- Adds user grading, points, badges, and achievements

-- Create user_gamification table
CREATE TABLE IF NOT EXISTS user_gamification (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) UNIQUE NOT NULL,
  
  -- Points and Tier
  total_points INT DEFAULT 0,
  tier ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond') DEFAULT 'bronze',
  
  -- Rating System
  star_rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  
  -- Profile Completion
  profile_completion_percent INT DEFAULT 0,
  
  -- Badges (JSON array of badge IDs)
  badges JSON DEFAULT '[]',
  
  -- Achievements (JSON array of achievement objects)
  achievements JSON DEFAULT '[]',
  
  -- Points History (Recent point transactions)
  points_history JSON DEFAULT '[]',
  
  -- Verified Trader Status
  verified_trader BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key
  CONSTRAINT fk_gamification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  points_required INT DEFAULT 0,
  tier_required ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond') DEFAULT NULL,
  is_special BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  requirement_type ENUM('trades', 'listings', 'points', 'days_active', 'reviews', 'referrals', 'special') NOT NULL,
  requirement_value INT NOT NULL,
  points_reward INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  achievement_id VARCHAR(36) NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_achievement (user_id, achievement_id),
  CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ua_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- Create user_reviews table for rating system
CREATE TABLE IF NOT EXISTS user_reviews (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  reviewer_id VARCHAR(36) NOT NULL,
  reviewed_user_id VARCHAR(36) NOT NULL,
  trade_offer_id VARCHAR(36),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_reviewed FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_trade FOREIGN KEY (trade_offer_id) REFERENCES trade_offers(id) ON DELETE SET NULL
);

-- Create point_transactions table for audit
CREATE TABLE IF NOT EXISTS point_transactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  points INT NOT NULL,
  action_type ENUM(
    'profile_complete',
    'email_verified',
    'phone_verified',
    'id_verified',
    'first_listing',
    'listing_approved',
    'first_trade',
    'trade_completed',
    'review_received',
    'streak_bonus',
    'referral_bonus',
    'special_achievement',
    'admin_bonus',
    'admin_deduct'
  ) NOT NULL,
  description VARCHAR(255),
  balance_after INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_pt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_gamification_user ON user_gamification(user_id);
CREATE INDEX idx_gamification_tier ON user_gamification(tier);
CREATE INDEX idx_gamification_points ON user_gamification(total_points);
CREATE INDEX idx_reviews_reviewed ON user_reviews(reviewed_user_id);
CREATE INDEX idx_reviews_reviewer ON user_reviews(reviewer_id);
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- Insert default badges
INSERT INTO badges (id, name, slug, description, icon, color, points_required, tier_required, is_special) VALUES
  ('badge-001', 'First Steps', 'first-steps', 'Complete your profile', 'User', '#3B82F6', 0, NULL, FALSE),
  ('badge-002', 'Verified Trader', 'verified-trader', 'Complete ID verification', 'Shield', '#10B981', 0, NULL, FALSE),
  ('badge-003', 'Early Bird', 'early-bird', 'One of the first 1000 users', 'Sparkles', '#F59E0B', 0, NULL, TRUE),
  ('badge-004', 'Top Trader', 'top-trader', 'Complete 50 successful trades', 'Trophy', '#8B5CF6', 0, NULL, FALSE),
  ('badge-005', 'Community Helper', 'community-helper', 'Help 10 new users', 'Heart', '#EC4899', 0, NULL, FALSE),
  ('badge-006', 'Silver Status', 'silver-status', 'Reach Silver tier', 'Medal', '#94A3B8', 0, 'silver', FALSE),
  ('badge-007', 'Gold Status', 'gold-status', 'Reach Gold tier', 'Medal', '#F59E0B', 0, 'gold', FALSE),
  ('badge-008', 'Platinum Elite', 'platinum-elite', 'Reach Platinum tier', 'Crown', '#E5E4E2', 0, 'platinum', FALSE),
  ('badge-009', 'Diamond Legend', 'diamond-legend', 'Reach Diamond tier', 'Diamond', '#60A5FA', 0, 'diamond', FALSE),
  ('badge-010', 'Power Seller', 'power-seller', 'List 100 items', 'Rocket', '#F97316', 0, NULL, FALSE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert default achievements
INSERT INTO achievements (id, name, slug, description, icon, color, requirement_type, requirement_value, points_reward) VALUES
  ('ach-001', 'Welcome Aboard', 'welcome', 'Join Barter Trade Namibia', 'PartyPopper', '#3B82F6', 'special', 1, 10),
  ('ach-002', 'Profile Pro', 'profile-complete', 'Complete your profile 100%', 'UserCheck', '#10B981', 'special', 1, 25),
  ('ach-003', 'First Trade', 'first-trade', 'Complete your first trade', 'Handshake', '#8B5CF6', 'trades', 1, 20),
  ('ach-004', 'Trader Rising', 'trader-5', 'Complete 5 trades', 'TrendingUp', '#F59E0B', 'trades', 5, 50),
  ('ach-005', 'Master Trader', 'trader-25', 'Complete 25 trades', 'Award', '#EC4899', 'trades', 25, 100),
  ('ach-006', 'Legend Trader', 'trader-100', 'Complete 100 trades', 'Trophy', '#EF4444', 'trades', 100, 250),
  ('ach-007', 'First Listing', 'first-listing', 'Create your first listing', 'Package', '#3B82F6', 'listings', 1, 10),
  ('ach-008', 'Active Seller', 'seller-10', 'Create 10 listings', 'Store', '#10B981', 'listings', 10, 50),
  ('ach-009', 'Super Seller', 'seller-50', 'Create 50 listings', 'Rocket', '#F97316', 'listings', 50, 150),
  ('ach-010', 'Five Stars', 'five-star', 'Receive a 5-star review', 'Star', '#F59E0B', 'reviews', 1, 15),
  ('ach-011', 'Trusted Seller', 'reviews-10', 'Receive 10 positive reviews', 'ThumbsUp', '#10B981', 'reviews', 10, 75),
  ('ach-012', 'Week Warrior', 'streak-7', 'Stay active for 7 consecutive days', 'Flame', '#EF4444', 'days_active', 7, 30),
  ('ach-013', 'Month Master', 'streak-30', 'Stay active for 30 consecutive days', 'Fire', '#F97316', 'days_active', 30, 100)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Migration complete
SELECT 'Gamification system tables created successfully' as status;
