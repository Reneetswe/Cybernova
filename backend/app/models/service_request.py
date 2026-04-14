from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ServiceRequest(Base):
    __tablename__ = "service_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    organization_name = Column(String, nullable=False)
    country = Column(String, nullable=False)
    industry_sector = Column(String, nullable=False)
    additional_notes = Column(Text, nullable=True)
    status = Column(String, default="new_inquiry", nullable=False)  # new_inquiry, qualified, proposal_sent, negotiation, confirmed_contract, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    contract_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    services = relationship("ServiceRequestService", back_populates="service_request", cascade="all, delete-orphan")
    feedback = relationship("CustomerFeedback", back_populates="service_request", uselist=False)

class ServiceRequestService(Base):
    __tablename__ = "service_request_services"
    
    id = Column(Integer, primary_key=True, index=True)
    service_request_id = Column(Integer, ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False)
    service_name = Column(String, nullable=False)
    
    # Relationships
    service_request = relationship("ServiceRequest", back_populates="services")
