from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.satisfaction_feedback import SatisfactionFeedback
from app.services.feedback_service import FeedbackService
from app.schemas.satisfaction_feedback import (
    FeedbackTokenInfo,
    SatisfactionFeedbackSubmit,
    SatisfactionFeedbackResponse,
    SatisfactionAnalytics,
    FeedbackListItem
)
from typing import List

router = APIRouter()


# ============================================
# PUBLIC ENDPOINTS (no auth required)
# ============================================

@router.get("/feedback/validate/{token}", response_model=FeedbackTokenInfo)
def validate_feedback_token(token: str, db: Session = Depends(get_db)):
    """Validate a feedback token and return context for the form"""
    db_token = FeedbackService.validate_token(db, token)
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid, expired, or already used feedback link."
        )
    return FeedbackTokenInfo(
        token=db_token.token,
        full_name=db_token.full_name,
        email=db_token.email,
        feedback_type=db_token.feedback_type,
        service_name=db_token.service_name,
        webinar_title=db_token.webinar_title,
        request_id=db_token.request_id,
        webinar_id=db_token.webinar_id,
    )


@router.post("/feedback/submit", response_model=SatisfactionFeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(data: SatisfactionFeedbackSubmit, db: Session = Depends(get_db)):
    """Submit satisfaction feedback using a valid token"""
    try:
        feedback = FeedbackService.submit_feedback(
            db=db,
            token=data.token,
            rating=data.rating,
            experience_rating=data.experience_rating,
            recommendation_score=data.recommendation_score,
            liked_most=data.liked_most,
            improvements=data.improvements,
            comments=data.comments,
            respondent_name=data.respondent_name,
            respondent_email=data.respondent_email,
        )
        return feedback
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============================================
# ADMIN ENDPOINTS (auth required)
# ============================================

@router.get("/admin/satisfaction-analytics", response_model=SatisfactionAnalytics)
def get_satisfaction_analytics(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get full satisfaction analytics for admin dashboard"""
    return FeedbackService.get_satisfaction_analytics(db)


@router.get("/admin/satisfaction-feedback", response_model=List[FeedbackListItem])
def get_all_feedback(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get all satisfaction feedback with pagination"""
    results = db.query(SatisfactionFeedback).order_by(
        SatisfactionFeedback.submitted_at.desc()
    ).offset(skip).limit(limit).all()

    return [
        FeedbackListItem(
            id=f.id,
            respondent_name=f.respondent_name,
            respondent_email=f.respondent_email,
            feedback_type=f.feedback_type,
            rating=f.rating,
            experience_rating=f.experience_rating,
            recommendation_score=f.recommendation_score,
            comments=f.comments,
            submitted_at=f.submitted_at,
        ) for f in results
    ]


@router.post("/admin/send-feedback-request")
def send_feedback_request(
    email: str,
    full_name: str,
    feedback_type: str = "service",
    request_id: int = None,
    webinar_id: int = None,
    service_name: str = None,
    webinar_title: str = None,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Manually trigger a feedback request email (admin only)"""
    token = FeedbackService.create_feedback_token(
        db=db,
        email=email,
        full_name=full_name,
        feedback_type=feedback_type,
        request_id=request_id,
        webinar_id=webinar_id,
        service_name=service_name,
        webinar_title=webinar_title,
    )
    return {"message": "Feedback request sent", "token": token.token}
