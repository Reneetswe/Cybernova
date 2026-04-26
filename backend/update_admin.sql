-- Update admin user password hash
-- This will update the existing admin user with the correct password hash for 'admin123'
-- Using SHA-256 with salt (format: salt$hash)

-- Update existing admin user or insert if not present
UPDATE admin_users 
SET password_hash = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4$98c122615a783198b0e4e0df0b3988b251d9c9b5ef16e390501d337a2fd0e065',
    email = 'admin@cybernova.co.bw'
WHERE email = 'admin@cybernova.com' OR email = 'admin@cybernova.co.bw';

-- If no row was updated, insert a new admin user
INSERT INTO admin_users (full_name, email, password_hash)
SELECT 'CyberNova Admin', 'admin@cybernova.co.bw', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4$98c122615a783198b0e4e0df0b3988b251d9c9b5ef16e390501d337a2fd0e065'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@cybernova.co.bw');

-- Verify the update
SELECT id, full_name, email, created_at FROM admin_users WHERE email = 'admin@cybernova.co.bw';
