-- Barter Trade Namibia - Production Database Initialization
-- Run this script to set up the initial database with admin user and categories
-- Database: barter_trade
-- User: barter_trade / Freedom@2025

-- ============================================
-- CREATE ADMIN USER
-- Email: admin@bartertrade.na
-- Password: admin123
-- ============================================

INSERT INTO users (
  id, email, password_hash, name, phone, gender, region, town, 
  street_address, postal_code, avatar, role, wallet_balance, 
  is_verified, is_banned, ban_reason, id_verification_status, 
  id_rejection_reason, national_id_front, national_id_back,
  last_seen, created_at, updated_at
) VALUES (
  'admin-001',
  'admin@bartertrade.na',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4oaT1K6JhJGq6K9m', -- admin123
  'System Administrator',
  '+264 81 000 0000',
  'other',
  'Khomas',
  'Windhoek',
  'Barter Trade HQ',
  '10001',
  NULL,
  'admin',
  100000.00,
  TRUE,
  FALSE,
  NULL,
  'approved',
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE 
  password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4oaT1K6JhJGq6K9m',
  role = 'admin',
  is_verified = TRUE;

-- ============================================
-- CREATE DEFAULT CATEGORIES
-- ============================================

INSERT INTO categories (id, name, slug, icon, color, description, image, listing_count, display_order, is_active) VALUES
('cat-1', 'Electronics', 'electronics', 'Smartphone', '#3B82F6', 'Phones, laptops, gadgets and tech accessories', NULL, 0, 1, TRUE),
('cat-2', 'Vehicles', 'vehicles', 'Car', '#EF4444', 'Cars, bikes, trucks and vehicle parts', NULL, 0, 2, TRUE),
('cat-3', 'Fashion', 'fashion', 'Shirt', '#8B5CF6', 'Clothing, shoes, bags and accessories', NULL, 0, 3, TRUE),
('cat-4', 'Home & Garden', 'home-garden', 'Home', '#10B981', 'Furniture, appliances, decor and tools', NULL, 0, 4, TRUE),
('cat-5', 'Services', 'services', 'Wrench', '#F59E0B', 'Professional skills, repairs and help', NULL, 0, 5, TRUE),
('cat-6', 'Sports & Outdoors', 'sports', 'Dumbbell', '#06B6D4', 'Equipment, gear and fitness items', NULL, 0, 6, TRUE),
('cat-7', 'Livestock & Farming', 'livestock', 'Beef', '#84CC16', 'Animals, farming equipment and supplies', NULL, 0, 7, TRUE),
('cat-8', 'Property', 'property', 'Building', '#F97316', 'Houses, land, rentals and real estate', NULL, 0, 8, TRUE),
('cat-9', 'Books & Media', 'books-media', 'Book', '#EC4899', 'Books, magazines, music and movies', NULL, 0, 9, TRUE),
('cat-10', 'Kids & Baby', 'kids-baby', 'Baby', '#14B8A6', 'Children items, toys and baby gear', NULL, 0, 10, TRUE)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  icon = VALUES(icon),
  color = VALUES(color),
  description = VALUES(description),
  is_active = TRUE;

-- ============================================
-- CREATE SYSTEM SETTINGS TABLE IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
  id VARCHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, description) VALUES
(UUID(), 'featured_listing_fee', '100.00', 'number', 'Fee for featuring a listing (N$)'),
(UUID(), 'offer_fee', '5.00', 'number', 'Fee for making an offer (N$)'),
(UUID(), 'platform_currency', 'NAD', 'string', 'Platform currency code'),
(UUID(), 'currency_symbol', 'N$', 'string', 'Currency display symbol'),
(UUID(), 'min_wallet_topup', '50.00', 'number', 'Minimum wallet top-up amount'),
(UUID(), 'max_wallet_topup', '50000.00', 'number', 'Maximum wallet top-up amount'),
(UUID(), 'listing_expiry_days', '90', 'number', 'Days until listing expires'),
(UUID(), 'enable_weather_display', 'true', 'boolean', 'Show weather in dashboard header')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ============================================
-- VERIFY SETUP
-- ============================================

SELECT 'Admin user created/updated' AS status, 
       (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admin_count;

SELECT 'Categories created' AS status,
       (SELECT COUNT(*) FROM categories WHERE is_active = TRUE) AS category_count;

SELECT 'System settings configured' AS status,
       (SELECT COUNT(*) FROM system_settings) AS settings_count;
