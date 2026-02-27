-- ============================================
-- BARTER TRADE NAMIBIA - Land Properties Schema
-- Migration 005: Land Properties & Property-Related Features
-- ============================================
-- This migration adds comprehensive support for land and property trading
-- Includes: Land listings, property documents, zoning, valuation history

-- ============================================
-- 1. LAND PROPERTIES TABLE
-- ============================================
-- Stores detailed information about land/property listings
CREATE TABLE IF NOT EXISTS land_properties (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  
  -- Property Type & Classification
  property_type ENUM('residential', 'commercial', 'agricultural', 'industrial', 'mixed_use', 'vacant_land', 'farm', 'plot') NOT NULL DEFAULT 'vacant_land',
  land_use_type ENUM('freehold', 'leasehold', 'communal', 'state', 'resettlement') DEFAULT 'freehold',
  zoning VARCHAR(50), -- e.g., 'Residential 1', 'Agricultural', 'General Business'
  
  -- Size & Dimensions
  land_size_hectares DECIMAL(12, 4),
  land_size_sqm DECIMAL(15, 2),
  frontage_meters DECIMAL(10, 2), -- Street frontage
  depth_meters DECIMAL(10, 2),
  
  -- Legal Information
  erf_number VARCHAR(100), -- Namibian property registration number
  deed_number VARCHAR(100),
  title_deed_available BOOLEAN DEFAULT FALSE,
  survey_diagram_available BOOLEAN DEFAULT FALSE,
  
  -- Physical Features
  has_water_access BOOLEAN DEFAULT FALSE,
  water_source ENUM('municipal', 'borehole', 'river', 'dam', 'none') DEFAULT 'none',
  has_electricity BOOLEAN DEFAULT FALSE,
  electricity_type ENUM('grid', 'solar', 'generator', 'none') DEFAULT 'none',
  has_road_access BOOLEAN DEFAULT FALSE,
  road_type ENUM('tarred', 'gravel', 'dirt', 'none') DEFAULT 'none',
  has_fencing BOOLEAN DEFAULT FALSE,
  fencing_type VARCHAR(100),
  
  -- For Agricultural Land
  soil_type VARCHAR(100),
  annual_rainfall_mm INT,
  grazing_capacity_lsu INT, -- Large Stock Units
  has_water_rights BOOLEAN DEFAULT FALSE,
  water_rights_allocation_m3 INT,
  
  -- For Developed Property
  has_buildings BOOLEAN DEFAULT FALSE,
  building_count INT DEFAULT 0,
  total_building_sqm DECIMAL(10, 2),
  main_building_year INT,
  
  -- Valuation & History
  municipal_valuation DECIMAL(15, 2),
  valuation_date DATE,
  last_sale_price DECIMAL(15, 2),
  last_sale_date DATE,
  
  -- Location Details (extends listing's basic location)
  constituency VARCHAR(100),
  nearest_town VARCHAR(100),
  distance_to_town_km DECIMAL(8, 2),
  gps_coordinates_polygon TEXT, -- JSON array of polygon points for land boundary
  
  -- Additional Notes
  features TEXT, -- JSON array of additional features
  restrictions TEXT, -- Any land use restrictions
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  INDEX idx_property_type (property_type),
  INDEX idx_land_use (land_use_type),
  INDEX idx_region_type (property_type, constituency),
  INDEX idx_size (land_size_hectares)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. PROPERTY DOCUMENTS TABLE
-- ============================================
-- Stores documents related to land/property listings
CREATE TABLE IF NOT EXISTS property_documents (
  id VARCHAR(36) PRIMARY KEY,
  land_property_id VARCHAR(36) NOT NULL,
  
  document_type ENUM(
    'title_deed',
    'survey_diagram',
    'zoning_certificate',
    'rates_clearance',
    'transfer_duty',
    'compliance_certificate',
    'building_plans',
    'valuation_certificate',
    'water_rights',
    'environmental_clearance',
    'other'
  ) NOT NULL,
  
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  file_size_bytes INT,
  mime_type VARCHAR(100),
  
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by VARCHAR(36),
  verified_at TIMESTAMP NULL,
  verification_notes TEXT,
  
  uploaded_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (land_property_id) REFERENCES land_properties(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id),
  INDEX idx_document_type (document_type),
  INDEX idx_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. PROPERTY VALUATION HISTORY
-- ============================================
-- Track historical valuations for properties
CREATE TABLE IF NOT EXISTS property_valuations (
  id VARCHAR(36) PRIMARY KEY,
  land_property_id VARCHAR(36) NOT NULL,
  
  valuation_type ENUM('municipal', 'bank', 'private', 'self') NOT NULL,
  valuation_amount DECIMAL(15, 2) NOT NULL,
  valuation_date DATE NOT NULL,
  valuator_name VARCHAR(255),
  valuator_company VARCHAR(255),
  certificate_url VARCHAR(500),
  notes TEXT,
  
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (land_property_id) REFERENCES land_properties(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_valuation_date (valuation_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. LISTING INTERACTIONS - EXTENDED
-- ============================================
-- Add likes, shares tracking (if not exists)
CREATE TABLE IF NOT EXISTS listing_likes (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (listing_id, user_id),
  INDEX idx_listing (listing_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_shares (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  share_platform ENUM('whatsapp', 'facebook', 'twitter', 'email', 'copy_link', 'other') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_listing (listing_id),
  INDEX idx_platform (share_platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. LISTING COMMENTS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS listing_comments (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  parent_id VARCHAR(36), -- For replies
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP NULL,
  is_hidden BOOLEAN DEFAULT FALSE, -- Admin can hide inappropriate comments
  hidden_reason VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES listing_comments(id) ON DELETE CASCADE,
  INDEX idx_listing (listing_id),
  INDEX idx_user (user_id),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. LISTING VIEWS TRACKING (detailed)
-- ============================================
CREATE TABLE IF NOT EXISTS listing_views (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36), -- NULL for anonymous views
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(500),
  session_id VARCHAR(100),
  view_duration_seconds INT, -- How long they viewed
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_listing (listing_id),
  INDEX idx_user (user_id),
  INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  
  -- Notification Preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  
  -- Notification Types
  notify_messages BOOLEAN DEFAULT TRUE,
  notify_offers BOOLEAN DEFAULT TRUE,
  notify_listing_updates BOOLEAN DEFAULT TRUE,
  notify_promotions BOOLEAN DEFAULT FALSE,
  notify_price_drops BOOLEAN DEFAULT TRUE,
  
  -- Privacy Settings
  show_online_status BOOLEAN DEFAULT TRUE,
  show_last_seen BOOLEAN DEFAULT TRUE,
  show_phone_number BOOLEAN DEFAULT FALSE,
  show_email BOOLEAN DEFAULT FALSE,
  allow_contact_from_non_verified BOOLEAN DEFAULT TRUE,
  
  -- Display Preferences
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(10) DEFAULT 'NAD',
  theme ENUM('light', 'dark', 'system') DEFAULT 'system',
  compact_view BOOLEAN DEFAULT FALSE,
  
  -- Location Preferences
  default_region VARCHAR(100),
  search_radius_km INT DEFAULT 50,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. USER ONBOARDING PROGRESS
-- ============================================
CREATE TABLE IF NOT EXISTS user_onboarding (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  
  -- Onboarding Steps
  step_profile_complete BOOLEAN DEFAULT FALSE,
  step_avatar_uploaded BOOLEAN DEFAULT FALSE,
  step_id_verified BOOLEAN DEFAULT FALSE,
  step_first_listing BOOLEAN DEFAULT FALSE,
  step_first_save BOOLEAN DEFAULT FALSE,
  step_first_message BOOLEAN DEFAULT FALSE,
  step_wallet_funded BOOLEAN DEFAULT FALSE,
  step_first_trade BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  profile_completed_at TIMESTAMP NULL,
  avatar_uploaded_at TIMESTAMP NULL,
  id_verified_at TIMESTAMP NULL,
  first_listing_at TIMESTAMP NULL,
  first_save_at TIMESTAMP NULL,
  first_message_at TIMESTAMP NULL,
  wallet_funded_at TIMESTAMP NULL,
  first_trade_at TIMESTAMP NULL,
  
  -- Overall Progress
  onboarding_complete BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP NULL,
  onboarding_skipped BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add likes_count and shares_count to listings if not exists
-- These are denormalized for performance
ALTER TABLE listings 
  ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;

-- Add featured column if not exists
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS featured_priority INT DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured, featured_until);
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON listings(category_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_user_status ON listings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_region_status ON listings(region, status);

-- ============================================
-- 10. TRIGGERS FOR COUNT MAINTENANCE
-- ============================================

DELIMITER //

-- Trigger to update likes_count on listings
DROP TRIGGER IF EXISTS after_like_insert//
CREATE TRIGGER after_like_insert AFTER INSERT ON listing_likes
FOR EACH ROW
BEGIN
  UPDATE listings SET likes_count = likes_count + 1 WHERE id = NEW.listing_id;
END//

DROP TRIGGER IF EXISTS after_like_delete//
CREATE TRIGGER after_like_delete AFTER DELETE ON listing_likes
FOR EACH ROW
BEGIN
  UPDATE listings SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.listing_id;
END//

-- Trigger to update shares_count on listings
DROP TRIGGER IF EXISTS after_share_insert//
CREATE TRIGGER after_share_insert AFTER INSERT ON listing_shares
FOR EACH ROW
BEGIN
  UPDATE listings SET shares_count = shares_count + 1 WHERE id = NEW.listing_id;
END//

-- Trigger to update comments_count on listings
DROP TRIGGER IF EXISTS after_comment_insert//
CREATE TRIGGER after_comment_insert AFTER INSERT ON listing_comments
FOR EACH ROW
BEGIN
  IF NEW.parent_id IS NULL AND NEW.is_hidden = FALSE THEN
    UPDATE listings SET comments_count = comments_count + 1 WHERE id = NEW.listing_id;
  END IF;
END//

DROP TRIGGER IF EXISTS after_comment_delete//
CREATE TRIGGER after_comment_delete AFTER DELETE ON listing_comments
FOR EACH ROW
BEGIN
  IF OLD.parent_id IS NULL AND OLD.is_hidden = FALSE THEN
    UPDATE listings SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.listing_id;
  END IF;
END//

-- Trigger to create user_settings on user creation
DROP TRIGGER IF EXISTS after_user_insert_settings//
CREATE TRIGGER after_user_insert_settings AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO user_settings (id, user_id) VALUES (UUID(), NEW.id);
  INSERT INTO user_onboarding (id, user_id) VALUES (UUID(), NEW.id);
END//

DELIMITER ;

-- ============================================
-- 11. INSERT DEFAULT DATA
-- ============================================

-- Ensure 'property' category exists
INSERT IGNORE INTO categories (id, name, slug, icon, color, description, display_order, is_active)
VALUES (
  'cat-property',
  'Property & Land',
  'property',
  'Home',
  '#D4A106',
  'Land, plots, farms, and real estate for trade',
  1,
  TRUE
);

-- Add subcategories for property
INSERT IGNORE INTO subcategories (id, category_id, name, slug, description, display_order, is_active)
VALUES
  ('sub-vacant-land', 'cat-property', 'Vacant Land', 'vacant-land', 'Undeveloped plots and stands', 1, TRUE),
  ('sub-farms', 'cat-property', 'Farms', 'farms', 'Agricultural farms and smallholdings', 2, TRUE),
  ('sub-residential', 'cat-property', 'Residential Property', 'residential', 'Houses, townhouses, and apartments', 3, TRUE),
  ('sub-commercial', 'cat-property', 'Commercial Property', 'commercial', 'Business premises and offices', 4, TRUE),
  ('sub-industrial', 'cat-property', 'Industrial Property', 'industrial', 'Warehouses and factories', 5, TRUE);

-- ============================================
-- END OF MIGRATION
-- ============================================
