-- Update admin user password hash
-- This will update the existing admin user with the correct password hash for 'Admin@123'
-- Using SHA-256 with salt (format: salt$hash)

UPDATE admin_users 
SET password_hash = '8589a7bef5e4fabd53f1d055cd88cc32$9b2c519a94669eea712a1dd6340affb4467e198f010173314cf6464cb58e029f'
WHERE email = 'admin@cybernova.com';

-- Verify the update
SELECT id, full_name, email, created_at FROM admin_users WHERE email = 'admin@cybernova.com';
