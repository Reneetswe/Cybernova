from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# --- Public feedback form ---

class FeedbackTokenInfo(BaseModel):
    """Returned when validating a feedback token"""
    token: str
    full_name: str
    email: str
    feedback_type: str
    service_name: Optional[str] = None
    webinar_title: Optional[str] = None
    request_id: Optional[int] = None
    webinar_id: Optional[int] = None


class SatisfactionFeedbackSubmit(BaseModel):
    """Public form submission"""
    token: str
    rating: int = Field(..., ge=1, le=5)
    experience_rating: Optional[int] = Field(None, ge=1, le=5)
    recommendation_score: Optional[int] = Field(None, ge=1, le=10)
    liked_most: Optional[str] = None
    improvements: Optional[str] = None
    comments: Optional[str] = None
    respondent_name: Optional[str] = None
    respondent_email: Optional[str] = None


class SatisfactionFeedbackResponse(BaseModel):
    id: int
    token: str
    request_id: Optional[int]
    webinar_id: Optional[int]
    feedback_type: str
    rating: int
    experience_rating: Optional[int]
    recommendation_score: Optional[int]
    liked_most: Optional[str]
    improvements: Optional[str]
    comments: Optional[str]
    respondent_name: Optional[str]
    respondent_email: Optional[str]
    submitted_at: datetime

    class Config:
        from_attributes = True


# --- Admin analytics ---

class SatisfactionSummary(BaseModel):
    average_score: float
    total_feedback: int
    positive_percentage: float
    negative_percentage: float
    change_avg_score: float
    change_total_feedback: float
    change_positive: float
    change_negative: float


class SatisfactionTrendPoint(BaseModel):
    date: str
    average_rating: float


class SatisfactionDistribution(BaseModel):
    stars: int
    count: int
    percentage: float


class LowRatingAlert(BaseModel):
    id: int
    respondent_name: Optional[str]
    respondent_email: Optional[str]
    rating: int
    feedback_type: str
    comments: Optional[str]
    submitted_at: datetime


class FeedbackListItem(BaseModel):
    id: int
    respondent_name: Optional[str]
    respondent_email: Optional[str]
    feedback_type: str
    rating: int
    experience_rating: Optional[int]
    recommendation_score: Optional[int]
    comments: Optional[str]
    submitted_at: datetime

    class Config:
        from_attributes = True


class SatisfactionAnalytics(BaseModel):
    summary: SatisfactionSummary
    trend: List[SatisfactionTrendPoint]
    distribution: List[SatisfactionDistribution]
    low_rating_alerts: List[LowRatingAlert]
    recent_feedback: List[FeedbackListItem]
