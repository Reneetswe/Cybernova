-- Migration: Add satisfaction feedback system
-- This creates the new satisfaction_feedback table and feedback_tokens table

-- Satisfaction Feedback Table (replaces simple customer_feedback for detailed tracking)
CREATE TABLE IF NOT EXISTS satisfaction_feedback (
    id SERIAL PRIMARY KEY,
    token VARCHAR UNIQUE NOT NULL,
    request_id INTEGER REFERENCES service_requests(id) ON DELETE SET NULL,
    webinar_id INTEGER REFERENCES webinars(id) ON DELETE SET NULL,
    feedback_type VARCHAR NOT NULL DEFAULT 'service', -- 'service' or 'webinar'
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
    feedback_type VARCHAR NOT NULL DEFAULT 'service', -- 'service' or 'webinar'
    request_id INTEGER REFERENCES service_requests(id) ON DELETE SET NULL,
    webinar_id INTEGER REFERENCES webinars(id) ON DELETE SET NULL,
    service_name VARCHAR,
    webinar_title VARCHAR,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_tokens_token ON feedback_tokens(token);
CREATE INDEX IF NOT EXISTS idx_feedback_tokens_email ON feedback_tokens(email);

-- Seed some sample satisfaction feedback data
INSERT INTO satisfaction_feedback (token, request_id, feedback_type, rating, experience_rating, recommendation_score, liked_most, improvements, comments, respondent_name, respondent_email, submitted_at)
VALUES
    ('sample-token-001', NULL, 'service', 5, 5, 10, 'Professional team and thorough analysis', 'Faster turnaround time', 'Excellent service and very professional team.', 'John Smith', 'john@acmecorp.com', NOW() - INTERVAL '1 day'),
    ('sample-token-002', NULL, 'service', 4, 4, 8, 'Responsive team', 'Better documentation', 'Very good experience. The team was responsive.', 'Sarah Johnson', 'sarah@techsol.com', NOW() - INTERVAL '2 days'),
    ('sample-token-003', NULL, 'service', 4, 5, 9, 'Comprehensive insights', 'More detailed reports', 'Good insights provided. Would recommend.', 'Mike Chen', 'mike@globalind.com', NOW() - INTERVAL '3 days'),
    ('sample-token-004', NULL, 'service', 5, 5, 10, 'Quick turnaround', NULL, 'Quick response and issue resolved effectively.', 'Lisa Park', 'lisa@datasecure.com', NOW() - INTERVAL '4 days'),
    ('sample-token-005', NULL, 'webinar', 3, 3, 6, 'Knowledgeable speakers', 'Better documentation and follow-up materials', 'Helpful team but documentation can be improved.', 'Tom Brown', 'tom@innovate.com', NOW() - INTERVAL '5 days'),
    ('sample-token-006', NULL, 'service', 5, 5, 9, 'Attention to detail', NULL, 'Outstanding support and expertise.', 'Amy Wilson', 'amy@finserv.com', NOW() - INTERVAL '6 days'),
    ('sample-token-007', NULL, 'webinar', 5, 4, 8, 'Great content', 'More interactive sessions', 'Very informative webinar, learned a lot.', 'David Lee', 'david@healthco.com', NOW() - INTERVAL '7 days'),
    ('sample-token-008', NULL, 'service', 2, 2, 4, NULL, 'Response time needs improvement', 'Not satisfied with the response time.', 'Chris Taylor', 'chris@retailplus.com', NOW() - INTERVAL '8 days'),
    ('sample-token-009', NULL, 'service', 4, 4, 7, 'Good results', 'Pricing transparency', 'Professional team, good results.', 'Emma Davis', 'emma@edutech.com', NOW() - INTERVAL '9 days'),
    ('sample-token-010', NULL, 'service', 1, 1, 2, NULL, 'Communication needs major improvement', 'Poor communication.', 'James Miller', 'james@startuphub.com', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;
