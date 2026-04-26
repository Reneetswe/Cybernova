from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class SatisfactionFeedback(Base):
    __tablename__ = "satisfaction_feedback"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    request_id = Column(Integer, ForeignKey("service_requests.id", ondelete="SET NULL"), nullable=True)
    webinar_id = Column(Integer, ForeignKey("webinars.id", ondelete="SET NULL"), nullable=True)
    feedback_type = Column(String, nullable=False, default="service")  # 'service' or 'webinar'
    rating = Column(Integer, nullable=False)
    experience_rating = Column(Integer, nullable=True)
    recommendation_score = Column(Integer, nullable=True)
    liked_most = Column(Text, nullable=True)
    improvements = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    respondent_name = Column(String, nullable=True)
    respondent_email = Column(String, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_sat_rating_range'),
        CheckConstraint('experience_rating IS NULL OR (experience_rating >= 1 AND experience_rating <= 5)', name='check_experience_rating_range'),
        CheckConstraint('recommendation_score IS NULL OR (recommendation_score >= 1 AND recommendation_score <= 10)', name='check_recommendation_range'),
    )


class FeedbackToken(Base):
    __tablename__ = "feedback_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    feedback_type = Column(String, nullable=False, default="service")
    request_id = Column(Integer, ForeignKey("service_requests.id", ondelete="SET NULL"), nullable=True)
    webinar_id = Column(Integer, ForeignKey("webinars.id", ondelete="SET NULL"), nullable=True)
    service_name = Column(String, nullable=True)
    webinar_title = Column(String, nullable=True)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
