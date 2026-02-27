-- ============================================================================
-- COMPREHENSIVE MYSQL MIGRATION SCRIPT FOR BARTER TRADE PLATFORM
-- ============================================================================
-- This script:
-- 1. Fixes the vouchers table status enum mismatch
-- 2. Adds category-specific fields for vehicles, land, electronics
-- 3. Adds feature toggle support with N$100 charge
-- 4. Creates missing tables for complete platform functionality
-- ============================================================================

-- ============================================================================
-- SECTION 1: FIX VOUCHERS TABLE STATUS ENUM
-- ============================================================================
-- The database uses: 'available','redeemed','expired','cancelled'
-- The application code uses: 'unused','used','disabled','expired'

-- First, update existing data to use new status values
UPDATE vouchers SET status = 'unused' WHERE status = 'available' OR status = '';
UPDATE vouchers SET status = 'used' WHERE status = 'redeemed';
UPDATE vouchers SET status = 'disabled' WHERE status = 'cancelled';

-- Alter the ENUM to match application code expectations
ALTER TABLE vouchers 
MODIFY COLUMN status ENUM('unused', 'used', 'disabled', 'expired', 'exported') DEFAULT 'unused';

-- Add exported_at column if not exists
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS exported_at DATETIME DEFAULT NULL AFTER expires_at;

-- Add topup_request_id for linking vouchers to mobile money requests
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS topup_request_id VARCHAR(36) DEFAULT NULL AFTER batch_id;

-- Add index for topup_request_id
CREATE INDEX IF NOT EXISTS idx_vouchers_topup_request ON vouchers(topup_request_id);

-- ============================================================================
-- SECTION 2: LISTING FEATURE TOGGLES TABLE
-- ============================================================================
-- Supports premium features with N$100 charge for visibility boost

CREATE TABLE IF NOT EXISTS listing_features (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    feature_type ENUM('featured', 'highlighted', 'priority_search', 'badge', 'extended_visibility') NOT NULL,
    is_enabled TINYINT(1) DEFAULT 1,
    charge_amount DECIMAL(10,2) DEFAULT 100.00,
    valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_until DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_listing_feature (listing_id, feature_type),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- SECTION 3: VEHICLE-SPECIFIC FIELDS TABLE
-- ============================================================================
-- For category: vehicles (cars, trucks, motorcycles)

CREATE TABLE IF NOT EXISTS listing_vehicle_details (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    vehicle_type ENUM('sedan', 'hatchback', 'suv', 'mpv', 'truck', 'pickup', 'van', 'coupe', 'convertible', 'wagon', 'motorcycle', 'other') NOT NULL,
    make VARCHAR(100) DEFAULT NULL COMMENT 'e.g., Toyota, Ford, BMW',
    model VARCHAR(100) DEFAULT NULL COMMENT 'e.g., Corolla, Hilux, F-150',
    year_model YEAR DEFAULT NULL,
    color VARCHAR(50) DEFAULT NULL,
    mileage INT DEFAULT NULL COMMENT 'In kilometers',
    fuel_type ENUM('petrol', 'diesel', 'electric', 'hybrid', 'lpg', 'other') DEFAULT NULL,
    transmission ENUM('manual', 'automatic', 'cvt', 'dct', 'other') DEFAULT NULL,
    engine_size VARCHAR(20) DEFAULT NULL COMMENT 'e.g., 2.0L, 1800cc',
    body_style VARCHAR(50) DEFAULT NULL,
    drive_type ENUM('fwd', 'rwd', 'awd', '4wd', 'other') DEFAULT NULL,
    registration_status ENUM('registered', 'not_registered', 'expired') DEFAULT NULL,
    registration_number VARCHAR(20) DEFAULT NULL,
    vin_number VARCHAR(50) DEFAULT NULL,
    service_history TINYINT(1) DEFAULT 0,
    accident_free TINYINT(1) DEFAULT 1,
    number_of_owners INT DEFAULT 1,
    extras TEXT DEFAULT NULL COMMENT 'JSON array of extras/features',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_listing_vehicle (listing_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- SECTION 4: LAND/PROPERTY SPECIFIC FIELDS TABLE
-- ============================================================================
-- For category: land (commercial, residential, communal)

CREATE TABLE IF NOT EXISTS listing_land_details (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    land_type ENUM('commercial', 'residential', 'communal', 'agricultural', 'industrial', 'mixed_use', 'other') NOT NULL,
    size_sqm DECIMAL(15,2) DEFAULT NULL COMMENT 'Size in square meters',
    size_hectares DECIMAL(15,4) DEFAULT NULL COMMENT 'Size in hectares',
    has_title_deed TINYINT(1) DEFAULT 0,
    title_deed_number VARCHAR(100) DEFAULT NULL,
    zoning VARCHAR(100) DEFAULT NULL COMMENT 'Zoning classification',
    is_serviced TINYINT(1) DEFAULT 0 COMMENT 'Has water, electricity, etc.',
    services_available TEXT DEFAULT NULL COMMENT 'JSON array: water, electricity, sewage, roads',
    
    -- Communal Land specific fields
    village_name VARCHAR(200) DEFAULT NULL COMMENT 'For communal land',
    traditional_authority VARCHAR(200) DEFAULT NULL COMMENT 'Traditional authority name',
    chief_name VARCHAR(200) DEFAULT NULL COMMENT 'Chief/headman name',
    communal_certificate TINYINT(1) DEFAULT 0 COMMENT 'Has communal land certificate',
    
    -- Property features
    topography ENUM('flat', 'sloped', 'hilly', 'mixed') DEFAULT NULL,
    road_access ENUM('tarred', 'gravel', 'dirt', 'none') DEFAULT NULL,
    water_source ENUM('municipal', 'borehole', 'river', 'none', 'other') DEFAULT NULL,
    electricity_source ENUM('grid', 'solar', 'generator', 'none', 'other') DEFAULT NULL,
    fencing ENUM('fully_fenced', 'partially_fenced', 'not_fenced') DEFAULT NULL,
    
    -- Additional details
    nearest_town VARCHAR(200) DEFAULT NULL,
    distance_to_town_km DECIMAL(10,2) DEFAULT NULL,
    existing_structures TEXT DEFAULT NULL COMMENT 'Description of any buildings/structures',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_listing_land (listing_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- SECTION 5: ELECTRONICS SPECIFIC FIELDS TABLE
-- ============================================================================
-- For category: electronics (phones, laptops, TVs, etc.)

CREATE TABLE IF NOT EXISTS listing_electronics_details (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    electronics_type ENUM('smartphone', 'laptop', 'tablet', 'desktop', 'tv', 'gaming_console', 'camera', 'audio', 'appliance', 'other') NOT NULL,
    brand VARCHAR(100) DEFAULT NULL,
    model VARCHAR(200) DEFAULT NULL,
    storage_capacity VARCHAR(50) DEFAULT NULL COMMENT 'e.g., 128GB, 1TB',
    ram_size VARCHAR(20) DEFAULT NULL COMMENT 'e.g., 8GB, 16GB',
    screen_size VARCHAR(20) DEFAULT NULL COMMENT 'e.g., 6.7 inches, 55 inches',
    battery_health VARCHAR(20) DEFAULT NULL COMMENT 'e.g., 95%, Good',
    color VARCHAR(50) DEFAULT NULL,
    warranty_status ENUM('in_warranty', 'out_of_warranty', 'extended_warranty', 'unknown') DEFAULT NULL,
    warranty_end_date DATE DEFAULT NULL,
    original_accessories TINYINT(1) DEFAULT 0 COMMENT 'Includes original box/charger/etc',
    accessories_included TEXT DEFAULT NULL COMMENT 'List of included accessories',
    imei_number VARCHAR(20) DEFAULT NULL COMMENT 'For phones',
    serial_number VARCHAR(100) DEFAULT NULL,
    is_unlocked TINYINT(1) DEFAULT 1 COMMENT 'For phones - network unlocked',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_listing_electronics (listing_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- SECTION 6: LIVESTOCK SPECIFIC FIELDS TABLE
-- ============================================================================
-- For category: livestock (cattle, goats, poultry, etc.)

CREATE TABLE IF NOT EXISTS listing_livestock_details (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    livestock_type ENUM('cattle', 'goats', 'sheep', 'pigs', 'poultry', 'horses', 'donkeys', 'other') NOT NULL,
    breed VARCHAR(100) DEFAULT NULL,
    quantity INT DEFAULT 1,
    gender ENUM('male', 'female', 'mixed') DEFAULT NULL,
    age_months INT DEFAULT NULL COMMENT 'Age in months',
    weight_kg DECIMAL(10,2) DEFAULT NULL COMMENT 'Average weight in kg',
    is_vaccinated TINYINT(1) DEFAULT 0,
    vaccination_records TEXT DEFAULT NULL COMMENT 'JSON array of vaccination details',
    health_certificate TINYINT(1) DEFAULT 0,
    brand_mark VARCHAR(100) DEFAULT NULL COMMENT 'Ear tag or brand mark',
    feeding_type ENUM('grass_fed', 'grain_fed', 'mixed', 'other') DEFAULT NULL,
    pregnancy_status ENUM('pregnant', 'not_pregnant', 'unknown', 'na') DEFAULT 'na',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_listing_livestock (listing_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- SECTION 7: UPDATE TOPUP_REQUESTS TABLE FOR VOUCHER LINKING
-- ============================================================================
-- Link mobile money topup requests to generated vouchers

ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS voucher_id VARCHAR(36) DEFAULT NULL AFTER reference;
ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(20) DEFAULT NULL AFTER voucher_id;
ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT NULL;
ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS processed_by VARCHAR(36) DEFAULT NULL;
ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS processed_at DATETIME DEFAULT NULL;

-- Add index for voucher lookup
CREATE INDEX IF NOT EXISTS idx_topup_voucher ON topup_requests(voucher_id);

-- ============================================================================
-- SECTION 8: VOUCHER BATCHES TABLE FOR ADMIN GENERATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS voucher_batches (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    vendor_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    purpose ENUM('general_sale', 'mobile_money_topup', 'promotion', 'compensation', 'other') DEFAULT 'general_sale',
    topup_request_id VARCHAR(36) DEFAULT NULL COMMENT 'If generated for a mobile money request',
    notes TEXT DEFAULT NULL,
    created_by VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_batch_topup (topup_request_id),
    INDEX idx_batch_purpose (purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- SECTION 9: LISTING STATISTICS/ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_analytics (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    listing_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    views_count INT DEFAULT 0,
    unique_views INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    inquiries_count INT DEFAULT 0,
    offers_count INT DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_listing_date (listing_id, date),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- SECTION 10: ADD FEATURED FLAG AND PREMIUM FIELDS TO LISTINGS
-- ============================================================================

ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) DEFAULT 0 AFTER featured;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_highlighted TINYINT(1) DEFAULT 0 AFTER is_featured;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS priority_score INT DEFAULT 0 AFTER is_highlighted;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS feature_charge_paid DECIMAL(10,2) DEFAULT 0.00 AFTER priority_score;

-- ============================================================================
-- SECTION 11: CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_region ON listings(region);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured, is_highlighted);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at);

-- Vouchers indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_batch ON vouchers(batch_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_created_by ON vouchers(created_by);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ============================================================================
-- SECTION 12: UPDATE VIEWS FOR ADMIN DASHBOARD
-- ============================================================================

-- Drop and recreate view with correct voucher status
DROP VIEW IF EXISTS v_admin_dashboard;
CREATE VIEW v_admin_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_users_week,
    (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as new_users_month,
    (SELECT COUNT(*) FROM id_verification_requests WHERE status = 'pending') as pending_verifications,
    (SELECT COUNT(*) FROM users WHERE id_verified = 1) as verified_users,
    (SELECT COUNT(*) FROM listings WHERE status = 'active') as active_listings,
    (SELECT COUNT(*) FROM listings WHERE status = 'pending') as pending_listings,
    (SELECT COUNT(*) FROM listings WHERE status = 'flagged') as flagged_listings,
    (SELECT COUNT(*) FROM listings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as new_listings_week,
    (SELECT COUNT(*) FROM completed_trades) as completed_trades,
    (SELECT COUNT(*) FROM trade_offers WHERE status = 'pending') as pending_trades,
    (SELECT COALESCE(SUM(amount), 0) FROM topup_requests WHERE status = 'completed') as total_topups,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions) as total_transaction_volume,
    (SELECT COUNT(*) FROM vouchers WHERE status = 'unused') as available_vouchers,
    (SELECT COUNT(*) FROM vouchers WHERE status = 'used') as redeemed_vouchers,
    (SELECT COALESCE(SUM(amount), 0) FROM vouchers WHERE status = 'used') as redeemed_voucher_value,
    (SELECT COUNT(*) FROM listing_reports WHERE status = 'pending') as pending_listing_reports,
    (SELECT COUNT(*) FROM user_reports WHERE status = 'pending') as pending_user_reports;

-- ============================================================================
-- SECTION 13: INSERT DEFAULT CATEGORIES IF NOT EXISTS
-- ============================================================================

INSERT IGNORE INTO categories (id, name, slug, description, icon, display_order, is_active) VALUES
(UUID(), 'Electronics', 'electronics', 'Phones, TVs, computers, and gadgets', 'Smartphone', 1, 1),
(UUID(), 'Vehicles', 'vehicles', 'Cars, trucks, motorcycles, and more', 'Car', 2, 1),
(UUID(), 'Livestock', 'livestock', 'Cattle, goats, poultry, and farm animals', 'PiggyBank', 3, 1),
(UUID(), 'Land', 'land', 'Plots, farms, commercial, and residential land', 'MapPin', 4, 1),
(UUID(), 'Services', 'services', 'Skills, labor, and professional services', 'Wrench', 5, 1),
(UUID(), 'Other Goods', 'goods', 'Furniture, appliances, and miscellaneous', 'Package', 6, 1);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Migration completed successfully!' AS status;
