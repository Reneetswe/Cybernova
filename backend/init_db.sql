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

-- Insert Admin User (password: admin123)
-- Hash generated with SHA-256 + salt (matching security.py verify_password)
INSERT INTO admin_users (full_name, email, password_hash)
VALUES ('CyberNova Admin', 'admin@cybernova.co.bw', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4$98c122615a783198b0e4e0df0b3988b251d9c9b5ef16e390501d337a2fd0e065')
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

-- Satisfaction Feedback Table (detailed feedback via email links)
CREATE TABLE IF NOT EXISTS satisfaction_feedback (
    id SERIAL PRIMARY KEY,
    token VARCHAR UNIQUE NOT NULL,
    request_id INTEGER REFERENCES service_requests(id) ON DELETE SET NULL,
    webinar_id INTEGER REFERENCES webinars(id) ON DELETE SET NULL,
    feedback_type VARCHAR NOT NULL DEFAULT 'service',
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    experience_rating INTEGER CHECK (experience_rating >= 1 AND experience_rating <= 5),
    recommendation_score INTEGER CHECK (recommendation_score >= 1 AND recommendation_score <= 10),
    liked_most TEXT,
    improvements TEXT,
    comments TEXT,
    respondent_name VARCHAR,
    respondent_email VARCHAR,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_satisfaction_feedback_token ON satisfaction_feedback(token);
CREATE INDEX IF NOT EXISTS idx_satisfaction_feedback_rating ON satisfaction_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_satisfaction_feedback_submitted ON satisfaction_feedback(submitted_at);

-- Feedback Tokens Table (tracks pending feedback requests)
CREATE TABLE IF NOT EXISTS feedback_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR UNIQUE NOT NULL,
    email VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    feedback_type VARCHAR NOT NULL DEFAULT 'service',
    request_id INTEGER REFERENCES service_requests(id) ON DELETE SET NULL,
    webinar_id INTEGER REFERENCES webinars(id) ON DELETE SET NULL,
    service_name VARCHAR,
    webinar_title VARCHAR,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_tokens_token ON feedback_tokens(token);

-- Insert Sample Satisfaction Feedback Data
INSERT INTO satisfaction_feedback (token, feedback_type, rating, experience_rating, recommendation_score, liked_most, improvements, comments, respondent_name, respondent_email, submitted_at)
VALUES
    ('seed-001', 'service', 5, 5, 10, 'Professional team and thorough analysis', 'Faster turnaround time', 'Excellent service and very professional team.', 'John Smith', 'john@acmecorp.com', NOW() - INTERVAL '1 day'),
    ('seed-002', 'service', 4, 4, 8, 'Responsive team', 'Better documentation', 'Very good experience. The team was responsive.', 'Sarah Johnson', 'sarah@techsol.com', NOW() - INTERVAL '2 days'),
    ('seed-003', 'service', 4, 5, 9, 'Comprehensive insights', 'More detailed reports', 'Good insights provided. Would recommend.', 'Mike Chen', 'mike@globalind.com', NOW() - INTERVAL '3 days'),
    ('seed-004', 'service', 5, 5, 10, 'Quick turnaround', NULL, 'Quick response and issue resolved effectively.', 'Lisa Park', 'lisa@datasecure.com', NOW() - INTERVAL '4 days'),
    ('seed-005', 'webinar', 3, 3, 6, 'Knowledgeable speakers', 'Better follow-up materials', 'Helpful team but documentation can be improved.', 'Tom Brown', 'tom@innovate.com', NOW() - INTERVAL '5 days'),
    ('seed-006', 'service', 5, 5, 9, 'Attention to detail', NULL, 'Outstanding support and expertise.', 'Amy Wilson', 'amy@finserv.com', NOW() - INTERVAL '6 days'),
    ('seed-007', 'webinar', 5, 4, 8, 'Great content', 'More interactive sessions', 'Very informative webinar, learned a lot.', 'David Lee', 'david@healthco.com', NOW() - INTERVAL '7 days'),
    ('seed-008', 'service', 2, 2, 4, NULL, 'Response time needs improvement', 'Not satisfied with the response time.', 'Chris Taylor', 'chris@retailplus.com', NOW() - INTERVAL '8 days'),
    ('seed-009', 'service', 4, 4, 7, 'Good results', 'Pricing transparency', 'Professional team, good results.', 'Emma Davis', 'emma@edutech.com', NOW() - INTERVAL '9 days'),
    ('seed-010', 'service', 1, 1, 2, NULL, 'Communication needs major improvement', 'Poor communication.', 'James Miller', 'james@startuphub.com', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;
