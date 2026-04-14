-- CyberNova Analytics Database Schema

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone_number VARCHAR,
    organization_name VARCHAR NOT NULL,
    country VARCHAR NOT NULL,
    industry_sector VARCHAR NOT NULL,
    additional_notes TEXT,
    status VARCHAR NOT NULL DEFAULT 'new_inquiry',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    contract_confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Service Request Services Junction Table
CREATE TABLE IF NOT EXISTS service_request_services (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL,
    service_name VARCHAR NOT NULL,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE
);

-- Webinars Table
CREATE TABLE IF NOT EXISTS webinars (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    event_type VARCHAR NOT NULL,
    event_date VARCHAR NOT NULL,
    event_time VARCHAR NOT NULL,
    timezone VARCHAR NOT NULL,
    price NUMERIC(10, 2),
    capacity INTEGER,
    banner_gradient VARCHAR,
    tag_color VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webinar Registrations Table
CREATE TABLE IF NOT EXISTS webinar_registrations (
    id SERIAL PRIMARY KEY,
    webinar_id INTEGER NOT NULL,
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone_number VARCHAR,
    organization_name VARCHAR,
    country VARCHAR,
    industry_sector VARCHAR,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE,
    CONSTRAINT unique_webinar_email UNIQUE (webinar_id, email)
);

-- Customer Feedback Table
CREATE TABLE IF NOT EXISTS customer_feedback (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE
);

-- Insert Admin User (password: Admin@123)
-- Hash generated with bcrypt for 'Admin@123'
INSERT INTO admin_users (full_name, email, password_hash)
VALUES ('CyberNova Admin', 'admin@cybernova.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW')
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Webinars
INSERT INTO webinars (title, description, event_type, event_date, event_time, timezone, price, capacity, banner_gradient, tag_color)
VALUES 
    ('Ransomware Defence Strategies for African SMEs', 
     'Understand how modern ransomware operates and implement proven defences without enterprise budgets.', 
     'Webinar', '15 July 2025', '10:00 WAT', 'WAT', NULL, NULL, 
     'linear-gradient(90deg, #00C9A7, #0088FF)', 'rgba(0,136,255,0.1)'),
    
    ('Virtual Security Workshop: Phishing Simulation & Awareness', 
     'Interactive 3-hour workshop where your team participates in a live phishing exercise and debrief.', 
     'Workshop', '22 July 2025', '09:00 CAT', 'CAT', 250.00, 50, 
     'linear-gradient(90deg, #0088FF, #00C9A7)', 'rgba(0,201,167,0.1)'),
    
    ('SADC Cybersecurity Summit 2025 — Virtual Track', 
     'Join 800+ security professionals across Southern Africa for the region''s premier cybersecurity event.', 
     'Live Event', '5 August 2025', '08:00 CAT', 'CAT', NULL, NULL, 
     'linear-gradient(90deg, #FF6B35, #FF9500)', 'rgba(255,107,53,0.1)'),
    
    ('AI in Cybersecurity: Opportunities & Threats for 2026', 
     'How AI is being weaponised by attackers — and how defenders can harness it first. Includes Q&A.', 
     'Webinar', '19 August 2025', '14:00 CAT', 'CAT', NULL, NULL, 
     'linear-gradient(90deg, #9B59B6, #0088FF)', 'rgba(155,89,182,0.1)')
ON CONFLICT DO NOTHING;

-- Insert Sample Customer Feedback
INSERT INTO customer_feedback (service_request_id, rating, comment)
VALUES 
    (NULL, 5, 'Excellent service! Very professional and thorough.'),
    (NULL, 5, 'Great experience, highly recommend.'),
    (NULL, 5, 'Outstanding support and expertise.'),
    (NULL, 4, 'Very good service, minor delays but overall satisfied.'),
    (NULL, 4, 'Professional team, good results.'),
    (NULL, 3, 'Average experience, could be better.'),
    (NULL, 2, 'Not satisfied with the response time.'),
    (NULL, 1, 'Poor communication.');
