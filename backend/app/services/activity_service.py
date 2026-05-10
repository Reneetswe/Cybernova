from sqlalchemy.orm import Session
from typing import Optional
from app.models.activity_log import ActivityLog


def log_activity(
    db: Session,
    activity_type: str,
    title: str,
    details: Optional[str] = None,
    actor_name: Optional[str] = None,
    actor_email: Optional[str] = None,
    reference_id: Optional[int] = None,
):
    """Log an activity to the activity_logs table."""
    entry = ActivityLog(
        activity_type=activity_type,
        title=title,
        details=details,
        actor_name=actor_name,
        actor_email=actor_email,
        reference_id=reference_id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
