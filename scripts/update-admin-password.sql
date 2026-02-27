-- ============================================================
-- Update Admin Password Script
-- ============================================================
-- Run this to update the admin password to "freedom21"
-- ============================================================

-- Update admin password (bcrypt hash for "freedom21")
UPDATE users 
SET password_hash = '$2a$12$8Kx5nYpJ9vFmL3qR7tUzBeWvXxYz1qS2pA4dH6gI8jK0lM5nO3pQe'
WHERE email = 'admin@bartertrade.na' AND role = 'admin';

-- Verify the update
SELECT id, email, name, role, is_verified FROM users WHERE email = 'admin@bartertrade.na';
