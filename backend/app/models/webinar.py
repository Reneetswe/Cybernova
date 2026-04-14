from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Webinar(Base):
    __tablename__ = "webinars"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    event_type = Column(String, nullable=False)  # Webinar, Workshop, Live Event
    event_date = Column(String, nullable=False)  # e.g., "15 July 2025"
    event_time = Column(String, nullable=False)  # e.g., "10:00 WAT"
    timezone = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=True)  # NULL for free events
    capacity = Column(Integer, nullable=True)  # NULL for unlimited
    banner_gradient = Column(String, nullable=True)  # CSS gradient for banner
    tag_color = Column(String, nullable=True)  # Color for event tag
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    registrations = relationship("WebinarRegistration", back_populates="webinar", cascade="all, delete-orphan")

class WebinarRegistration(Base):
    __tablename__ = "webinar_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    webinar_id = Column(Integer, ForeignKey("webinars.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    organization_name = Column(String, nullable=True)
    country = Column(String, nullable=True)
    industry_sector = Column(String, nullable=True)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    webinar = relationship("Webinar", back_populates="registrations")
    
    # Unique constraint to prevent duplicate registrations
    __table_args__ = (
        UniqueConstraint('webinar_id', 'email', name='unique_webinar_email'),
    )
