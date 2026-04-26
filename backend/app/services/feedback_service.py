import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, cast, Date
from typing import Optional

from app.models.satisfaction_feedback import SatisfactionFeedback, FeedbackToken
from app.core.config import settings
from app.utils.email_service import send_feedback_email
from app.schemas.satisfaction_feedback import (
    SatisfactionSummary,
    SatisfactionTrendPoint,
    SatisfactionDistribution,
    LowRatingAlert,
    FeedbackListItem,
    SatisfactionAnalytics
)


class FeedbackService:

    @staticmethod
    def create_feedback_token(
        db: Session,
        email: str,
        full_name: str,
        feedback_type: str,
        request_id: Optional[int] = None,
        webinar_id: Optional[int] = None,
        service_name: Optional[str] = None,
        webinar_title: Optional[str] = None,
    ) -> FeedbackToken:
        """Create a secure feedback token and send the email"""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)

        db_token = FeedbackToken(
            token=token,
            email=email,
            full_name=full_name,
            feedback_type=feedback_type,
            request_id=request_id,
            webinar_id=webinar_id,
            service_name=service_name,
            webinar_title=webinar_title,
            expires_at=expires_at,
        )
        db.add(db_token)
        db.commit()
        db.refresh(db_token)

        # Build feedback URL
        frontend_url = settings.FRONTEND_URL.rstrip("/")
        feedback_url = f"{frontend_url}/index.html?feedback={token}"

        # Send the email
        label = service_name or webinar_title or "CyberNova Service"
        send_feedback_email(
            to_email=email,
            recipient_name=full_name,
            feedback_type=feedback_type,
            service_or_webinar_name=label,
            feedback_url=feedback_url,
        )

        return db_token

    @staticmethod
    def validate_token(db: Session, token: str) -> Optional[FeedbackToken]:
        """Validate a feedback token"""
        db_token = db.query(FeedbackToken).filter(
            FeedbackToken.token == token,
            FeedbackToken.is_used == False,
            FeedbackToken.expires_at > datetime.utcnow(),
        ).first()
        return db_token

    @staticmethod
    def submit_feedback(
        db: Session,
        token: str,
        rating: int,
        experience_rating: Optional[int] = None,
        recommendation_score: Optional[int] = None,
        liked_most: Optional[str] = None,
        improvements: Optional[str] = None,
        comments: Optional[str] = None,
        respondent_name: Optional[str] = None,
        respondent_email: Optional[str] = None,
    ) -> SatisfactionFeedback:
        """Submit feedback using a valid token"""
        db_token = db.query(FeedbackToken).filter(
            FeedbackToken.token == token,
            FeedbackToken.is_used == False,
            FeedbackToken.expires_at > datetime.utcnow(),
        ).first()

        if not db_token:
            raise ValueError("Invalid or expired feedback token")

        feedback = SatisfactionFeedback(
            token=token,
            request_id=db_token.request_id,
            webinar_id=db_token.webinar_id,
            feedback_type=db_token.feedback_type,
            rating=rating,
            experience_rating=experience_rating,
            recommendation_score=recommendation_score,
            liked_most=liked_most,
            improvements=improvements,
            comments=comments,
            respondent_name=respondent_name or db_token.full_name,
            respondent_email=respondent_email or db_token.email,
        )
        db.add(feedback)

        # Mark token as used
        db_token.is_used = True
        db.commit()
        db.refresh(feedback)
        return feedback

    @staticmethod
    def get_satisfaction_analytics(db: Session) -> SatisfactionAnalytics:
        """Get full satisfaction analytics for admin dashboard"""

        # --- Summary ---
        total = db.query(SatisfactionFeedback).count()
        avg_score = db.query(func.avg(SatisfactionFeedback.rating)).scalar()
        avg_score = round(float(avg_score), 1) if avg_score else 0.0

        positive = db.query(SatisfactionFeedback).filter(SatisfactionFeedback.rating >= 4).count()
        negative = db.query(SatisfactionFeedback).filter(SatisfactionFeedback.rating <= 2).count()
        pos_pct = round((positive / total * 100) if total > 0 else 0, 1)
        neg_pct = round((negative / total * 100) if total > 0 else 0, 1)

        # Month-over-month changes (current vs previous 30 days)
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)

        cur_total = db.query(SatisfactionFeedback).filter(SatisfactionFeedback.submitted_at >= thirty_days_ago).count()
        prev_total = db.query(SatisfactionFeedback).filter(
            SatisfactionFeedback.submitted_at >= sixty_days_ago,
            SatisfactionFeedback.submitted_at < thirty_days_ago
        ).count()

        cur_avg = db.query(func.avg(SatisfactionFeedback.rating)).filter(SatisfactionFeedback.submitted_at >= thirty_days_ago).scalar()
        prev_avg = db.query(func.avg(SatisfactionFeedback.rating)).filter(
            SatisfactionFeedback.submitted_at >= sixty_days_ago,
            SatisfactionFeedback.submitted_at < thirty_days_ago
        ).scalar()

        cur_avg = float(cur_avg) if cur_avg else 0.0
        prev_avg = float(prev_avg) if prev_avg else 0.0

        change_avg = round(((cur_avg - prev_avg) / prev_avg * 100) if prev_avg > 0 else 0, 1)
        change_total = round(((cur_total - prev_total) / prev_total * 100) if prev_total > 0 else 0, 1)

        cur_pos = db.query(SatisfactionFeedback).filter(
            SatisfactionFeedback.submitted_at >= thirty_days_ago, SatisfactionFeedback.rating >= 4
        ).count()
        cur_neg = db.query(SatisfactionFeedback).filter(
            SatisfactionFeedback.submitted_at >= thirty_days_ago, SatisfactionFeedback.rating <= 2
        ).count()
        prev_pos = db.query(SatisfactionFeedback).filter(
            SatisfactionFeedback.submitted_at >= sixty_days_ago,
            SatisfactionFeedback.submitted_at < thirty_days_ago,
            SatisfactionFeedback.rating >= 4
        ).count()
        prev_neg = db.query(SatisfactionFeedback).filter(
            SatisfactionFeedback.submitted_at >= sixty_days_ago,
            SatisfactionFeedback.submitted_at < thirty_days_ago,
            SatisfactionFeedback.rating <= 2
        ).count()

        cur_pos_pct = (cur_pos / cur_total * 100) if cur_total > 0 else 0
        prev_pos_pct = (prev_pos / prev_total * 100) if prev_total > 0 else 0
        cur_neg_pct = (cur_neg / cur_total * 100) if cur_total > 0 else 0
        prev_neg_pct = (prev_neg / prev_total * 100) if prev_total > 0 else 0

        summary = SatisfactionSummary(
            average_score=avg_score,
            total_feedback=total,
            positive_percentage=pos_pct,
            negative_percentage=neg_pct,
            change_avg_score=change_avg,
            change_total_feedback=change_total,
            change_positive=round(cur_pos_pct - prev_pos_pct, 1),
            change_negative=round(cur_neg_pct - prev_neg_pct, 1),
        )

        # --- Trend (daily average over last 30 days, grouped weekly) ---
        trend_data = db.query(
            cast(SatisfactionFeedback.submitted_at, Date).label("date"),
            func.avg(SatisfactionFeedback.rating).label("avg_rating"),
        ).filter(
            SatisfactionFeedback.submitted_at >= thirty_days_ago
        ).group_by("date").order_by("date").all()

        trend = [
            SatisfactionTrendPoint(
                date=str(row.date),
                average_rating=round(float(row.avg_rating), 1)
            ) for row in trend_data
        ]

        # --- Distribution ---
        distribution = []
        for stars in [5, 4, 3, 2, 1]:
            count = db.query(SatisfactionFeedback).filter(SatisfactionFeedback.rating == stars).count()
            pct = round((count / total * 100) if total > 0 else 0, 1)
            distribution.append(SatisfactionDistribution(stars=stars, count=count, percentage=pct))

        # --- Low rating alerts (below 3) ---
        low_ratings = db.query(SatisfactionFeedback).filter(
            SatisfactionFeedback.rating <= 2
        ).order_by(SatisfactionFeedback.submitted_at.desc()).limit(10).all()

        alerts = [
            LowRatingAlert(
                id=f.id,
                respondent_name=f.respondent_name,
                respondent_email=f.respondent_email,
                rating=f.rating,
                feedback_type=f.feedback_type,
                comments=f.comments,
                submitted_at=f.submitted_at,
            ) for f in low_ratings
        ]

        # --- Recent feedback ---
        recent = db.query(SatisfactionFeedback).order_by(
            SatisfactionFeedback.submitted_at.desc()
        ).limit(20).all()

        recent_list = [
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
            ) for f in recent
        ]

        return SatisfactionAnalytics(
            summary=summary,
            trend=trend,
            distribution=distribution,
            low_rating_alerts=alerts,
            recent_feedback=recent_list,
        )
