from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(String, nullable=False)  # service_request, status_update, webinar_registration, feedback
    title = Column(String, nullable=False)  # Short description e.g. "New service request submitted"
    details = Column(Text, nullable=True)  # Extended info e.g. "Penetration Testing - Acme Corp"
    actor_name = Column(String, nullable=True)  # Who performed the action
    actor_email = Column(String, nullable=True)
    reference_id = Column(Integer, nullable=True)  # ID of related record
    created_at = Column(DateTime(timezone=True), server_default=func.now())
