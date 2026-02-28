-- ============================================
-- Barter Trade Namibia - Complete Database Schema
-- PostgreSQL / Neon Serverless
-- ============================================

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS user_gamification CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS advertisements CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS voucher_batches CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS topup_requests CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_reviews CASCADE;
DROP TABLE IF EXISTS trade_offer_items CASCADE;
DROP TABLE IF EXISTS trade_offers CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS listing_comments CASCADE;
DROP TABLE IF EXISTS listing_likes CASCADE;
DROP TABLE IF EXISTS saved_listings CASCADE;
DROP TABLE IF EXISTS listing_wanted_items CASCADE;
DROP TABLE IF EXISTS listing_images CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    region VARCHAR(100) NOT NULL DEFAULT 'Khomas',
    town VARCHAR(100),
    street_address VARCHAR(255),
    postal_code VARCHAR(20),
    avatar TEXT,
    bio TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason TEXT,
    id_verification_status VARCHAR(20) NOT NULL DEFAULT 'not_submitted' CHECK (id_verification_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
    id_rejection_reason TEXT,
    national_id_front TEXT,
    national_id_back TEXT,
    business_name VARCHAR(255),
    business_registration VARCHAR(100),
    is_business BOOLEAN NOT NULL DEFAULT FALSE,
    social_links JSONB,
    qr_code VARCHAR(20) UNIQUE,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_region ON users(region);
CREATE INDEX idx_users_qr_code ON users(qr_code);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================
-- CATEGORIES & SUBCATEGORIES
-- ============================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'Package',
    color VARCHAR(20) NOT NULL DEFAULT '#ea580c',
    description TEXT,
    image TEXT,
    listing_count INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_display_order ON categories(display_order);

CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    listing_count INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, slug)
);

CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_subcategories_slug ON subcategories(slug);

-- ============================================
-- LISTINGS
-- ============================================

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    type VARCHAR(10) NOT NULL DEFAULT 'item' CHECK (type IN ('item', 'service')),
    value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
    condition VARCHAR(20) CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    region VARCHAR(100) NOT NULL,
    town VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'sold', 'flagged', 'expired', 'draft', 'rejected')),
    rejection_reason TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    saves INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    featured_until TIMESTAMP WITH TIME ZONE,
    trade_preferences TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_region ON listings(region);
CREATE INDEX idx_listings_featured ON listings(featured);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_value ON listings(value);

CREATE TABLE listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listing_images_listing ON listing_images(listing_id);
CREATE INDEX idx_listing_images_is_primary ON listing_images(is_primary);

CREATE TABLE listing_wanted_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listing_wanted_items_listing ON listing_wanted_items(listing_id);

CREATE TABLE saved_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_saved_listings_user ON saved_listings(user_id);
CREATE INDEX idx_saved_listings_listing ON saved_listings(listing_id);

CREATE TABLE listing_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_listing_likes_listing ON listing_likes(listing_id);

CREATE TABLE listing_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES listing_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listing_comments_listing ON listing_comments(listing_id);
CREATE INDEX idx_listing_comments_user ON listing_comments(user_id);
CREATE INDEX idx_listing_comments_parent ON listing_comments(parent_id);

-- ============================================
-- MESSAGING & CONVERSATIONS
-- ============================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_listing ON conversations(listing_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'offer', 'system')),
    offer_id UUID,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- TRADE OFFERS
-- ============================================

CREATE TABLE trade_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    wallet_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired', 'cancelled', 'completed')),
    counter_offer_id UUID REFERENCES trade_offers(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trade_offers_sender ON trade_offers(sender_id);
CREATE INDEX idx_trade_offers_receiver ON trade_offers(receiver_id);
CREATE INDEX idx_trade_offers_listing ON trade_offers(listing_id);
CREATE INDEX idx_trade_offers_status ON trade_offers(status);
CREATE INDEX idx_trade_offers_created_at ON trade_offers(created_at DESC);

CREATE TABLE trade_offer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_offer_id UUID NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    owner_type VARCHAR(10) NOT NULL CHECK (owner_type IN ('sender', 'receiver')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trade_offer_items_offer ON trade_offer_items(trade_offer_id);
CREATE INDEX idx_trade_offer_items_listing ON trade_offer_items(listing_id);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE user_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade_offer_id UUID REFERENCES trade_offers(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reviewer_id, trade_offer_id)
);

CREATE INDEX idx_user_reviews_reviewed ON user_reviews(reviewed_id);
CREATE INDEX idx_user_reviews_reviewer ON user_reviews(reviewer_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('trade', 'message', 'wallet', 'listing', 'system', 'offer', 'review', 'verification', 'badge')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- WALLET & TRANSACTIONS
-- ============================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('topup', 'transfer_in', 'transfer_out', 'listing_fee', 'featured_fee', 'offer_fee', 'voucher', 'trade', 'refund', 'withdrawal', 'bonus', 'referral')),
    amount DECIMAL(12, 2) NOT NULL,
    fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    balance_after DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    reference VARCHAR(100),
    description TEXT,
    related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    related_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_related_user ON transactions(related_user_id);

CREATE TABLE topup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    bank VARCHAR(50),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    receipt_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    voucher_code VARCHAR(50),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_topup_requests_user ON topup_requests(user_id);
CREATE INDEX idx_topup_requests_status ON topup_requests(status);
CREATE INDEX idx_topup_requests_created_at ON topup_requests(created_at DESC);

-- ============================================
-- VOUCHERS
-- ============================================

CREATE TABLE voucher_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    total_count INTEGER NOT NULL DEFAULT 0,
    used_count INTEGER NOT NULL DEFAULT 0,
    total_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    denomination DECIMAL(12, 2) NOT NULL,
    vendor VARCHAR(100),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voucher_batches_batch_number ON voucher_batches(batch_number);

CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'scratch' CHECK (type IN ('scratch', 'online', 'promotional')),
    status VARCHAR(20) NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'disabled', 'expired', 'exported')),
    vendor VARCHAR(100),
    batch_id UUID REFERENCES voucher_batches(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    used_by_phone VARCHAR(20),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_vouchers_batch ON vouchers(batch_id);
CREATE INDEX idx_vouchers_expires_at ON vouchers(expires_at);

-- ============================================
-- SYSTEM SETTINGS & CONFIGURATION
-- ============================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- ============================================
-- ADVERTISEMENTS
-- ============================================

CREATE TABLE advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    placement VARCHAR(30) NOT NULL DEFAULT 'banner' CHECK (placement IN ('banner', 'sidebar', 'listing_feed', 'featured', 'popup')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    target_regions TEXT[],
    priority INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_advertisements_active ON advertisements(is_active);
CREATE INDEX idx_advertisements_placement ON advertisements(placement);
CREATE INDEX idx_advertisements_dates ON advertisements(start_date, end_date);

-- ============================================
-- REPORTS & MODERATION
-- ============================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_type VARCHAR(20) NOT NULL CHECK (reported_type IN ('listing', 'user', 'message')),
    reported_id UUID NOT NULL,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    reported_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('spam', 'inappropriate', 'scam', 'fake', 'harassment', 'prohibited', 'other')),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- ============================================
-- GAMIFICATION
-- ============================================

CREATE TABLE user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    current_tier VARCHAR(20) NOT NULL DEFAULT 'bronze' CHECK (current_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    trades_completed INTEGER NOT NULL DEFAULT 0,
    listings_created INTEGER NOT NULL DEFAULT 0,
    reviews_given INTEGER NOT NULL DEFAULT 0,
    reviews_received INTEGER NOT NULL DEFAULT 0,
    average_rating DECIMAL(3, 2),
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_gamification_user ON user_gamification(user_id);
CREATE INDEX idx_user_gamification_tier ON user_gamification(current_tier);
CREATE INDEX idx_user_gamification_points ON user_gamification(total_points DESC);

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    category VARCHAR(30) NOT NULL CHECK (category IN ('trading', 'community', 'verification', 'special', 'seasonal')),
    points_required INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    requirement_type VARCHAR(30) NOT NULL CHECK (requirement_type IN ('trades', 'listings', 'reviews', 'referrals', 'wallet', 'streak', 'custom')),
    requirement_value INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- ============================================
-- WAITLIST (Pre-launch)
-- ============================================

CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    region VARCHAR(100),
    referral_source VARCHAR(100),
    is_notified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waitlist_email ON waitlist(email);

-- ============================================
-- ACTIVITY LOG (Admin)
-- ============================================

CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- ============================================
-- DEFAULT DATA - Categories
-- ============================================

INSERT INTO categories (name, slug, icon, color, description, display_order) VALUES
('Electronics', 'electronics', 'Smartphone', '#3b82f6', 'Phones, laptops, TVs, gadgets and more', 1),
('Vehicles', 'vehicles', 'Car', '#ef4444', 'Cars, motorcycles, trucks, and parts', 2),
('Fashion', 'fashion', 'Shirt', '#ec4899', 'Clothing, shoes, accessories', 3),
('Home & Garden', 'home-garden', 'Home', '#22c55e', 'Furniture, appliances, decor', 4),
('Sports & Outdoors', 'sports-outdoors', 'Dumbbell', '#f97316', 'Sports equipment, camping, fitness', 5),
('Books & Media', 'books-media', 'BookOpen', '#8b5cf6', 'Books, movies, music, games', 6),
('Services', 'services', 'Wrench', '#06b6d4', 'Professional and personal services', 7),
('Jobs', 'jobs', 'Briefcase', '#64748b', 'Job listings and opportunities', 8),
('Real Estate', 'real-estate', 'Building', '#0ea5e9', 'Properties for sale or rent', 9),
('Agriculture', 'agriculture', 'Tractor', '#84cc16', 'Farm equipment, livestock, produce', 10),
('Baby & Kids', 'baby-kids', 'Baby', '#f472b6', 'Baby gear, toys, kids clothing', 11),
('Art & Collectibles', 'art-collectibles', 'Palette', '#a855f7', 'Art, antiques, collectibles', 12);

-- ============================================
-- DEFAULT DATA - System Settings
-- ============================================

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('listing_fee', '5.00', 'number', 'Fee to post a new listing (NAD)', TRUE),
('featured_fee', '25.00', 'number', 'Fee to feature a listing (NAD)', TRUE),
('offer_fee', '2.00', 'number', 'Fee to send a trade offer (NAD)', TRUE),
('min_wallet_topup', '10.00', 'number', 'Minimum wallet top-up amount (NAD)', TRUE),
('max_wallet_topup', '10000.00', 'number', 'Maximum wallet top-up amount (NAD)', TRUE),
('transfer_fee_percentage', '2.5', 'number', 'Fee percentage for wallet transfers', TRUE),
('listing_expiry_days', '30', 'number', 'Days until listing expires', TRUE),
('offer_expiry_hours', '48', 'number', 'Hours until trade offer expires', TRUE),
('max_images_per_listing', '10', 'number', 'Maximum images per listing', TRUE),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', FALSE),
('registration_enabled', 'true', 'boolean', 'Allow new user registrations', FALSE),
('voucher_enabled', 'true', 'boolean', 'Enable voucher system', FALSE),
('referral_bonus', '10.00', 'number', 'Bonus amount for referrals (NAD)', TRUE),
('welcome_bonus', '5.00', 'number', 'Welcome bonus for new users (NAD)', TRUE);

-- ============================================
-- DEFAULT DATA - Badges
-- ============================================

INSERT INTO badges (name, slug, description, icon, color, category, points_required) VALUES
('Verified Trader', 'verified-trader', 'Completed ID verification', 'BadgeCheck', '#22c55e', 'verification', NULL),
('First Trade', 'first-trade', 'Completed your first trade', 'Handshake', '#3b82f6', 'trading', 10),
('Power Trader', 'power-trader', 'Completed 50+ trades', 'Zap', '#f59e0b', 'trading', 500),
('Top Seller', 'top-seller', 'Sold 100+ items', 'Trophy', '#eab308', 'trading', 1000),
('Community Helper', 'community-helper', 'Helped 25+ users', 'Heart', '#ec4899', 'community', 250),
('Early Adopter', 'early-adopter', 'Joined during beta', 'Star', '#8b5cf6', 'special', NULL),
('5-Star Trader', 'five-star', 'Maintained 5-star rating with 10+ reviews', 'Star', '#fbbf24', 'trading', 100);

-- ============================================
-- DEFAULT DATA - Achievements
-- ============================================

INSERT INTO achievements (name, slug, description, icon, points, requirement_type, requirement_value) VALUES
('First Steps', 'first-steps', 'Create your first listing', 'Flag', 10, 'listings', 1),
('Serial Lister', 'serial-lister', 'Create 10 listings', 'List', 50, 'listings', 10),
('Trading Pro', 'trading-pro', 'Complete 25 trades', 'TrendingUp', 250, 'trades', 25),
('Review Master', 'review-master', 'Write 20 reviews', 'MessageSquare', 100, 'reviews', 20),
('Network Builder', 'network-builder', 'Refer 5 friends', 'Users', 150, 'referrals', 5),
('Streak Champion', 'streak-champion', 'Login 30 days in a row', 'Flame', 300, 'streak', 30),
('Big Spender', 'big-spender', 'Top up N$1000 total', 'Wallet', 100, 'wallet', 1000);

-- ============================================
-- Create updated_at trigger function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listing_comments_updated_at BEFORE UPDATE ON listing_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_offers_updated_at BEFORE UPDATE ON trade_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
