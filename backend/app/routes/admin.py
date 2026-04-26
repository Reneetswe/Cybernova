from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.service_request import ServiceRequest, ServiceRequestService
from app.models.webinar import WebinarRegistration
from app.models.customer_feedback import CustomerFeedback
from app.schemas.service_request import ServiceRequestResponse, ServiceRequestStatusUpdate
from app.schemas.webinar import WebinarRegistrationResponse
from app.schemas.dashboard import (
    DashboardSummary,
    MonthlyServiceRequest,
    IndustryDistribution,
    GeographicDistribution,
    ConversionFunnel,
    CustomerSatisfactionMetrics
)
from app.schemas.customer_feedback import CustomerFeedbackCreate, CustomerFeedbackResponse
from app.services.dashboard_service import DashboardService
from app.services.feedback_service import FeedbackService

router = APIRouter()

# Dashboard endpoints
@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get dashboard summary metrics"""
    return DashboardService.get_dashboard_summary(db)

@router.get("/dashboard/monthly-service-requests", response_model=List[MonthlyServiceRequest])
def get_monthly_service_requests(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get monthly service requests for the last 12 months"""
    return DashboardService.get_monthly_service_requests(db)

@router.get("/dashboard/industry-distribution", response_model=List[IndustryDistribution])
def get_industry_distribution(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get industry distribution of service requests"""
    return DashboardService.get_industry_distribution(db)

@router.get("/dashboard/geographic-distribution", response_model=List[GeographicDistribution])
def get_geographic_distribution(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get geographic distribution of service requests"""
    return DashboardService.get_geographic_distribution(db)

@router.get("/dashboard/conversion-funnel", response_model=ConversionFunnel)
def get_conversion_funnel(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get conversion funnel metrics"""
    return DashboardService.get_conversion_funnel(db)

@router.get("/dashboard/customer-satisfaction", response_model=CustomerSatisfactionMetrics)
def get_customer_satisfaction(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get customer satisfaction metrics"""
    return DashboardService.get_customer_satisfaction(db)

# Service Request Management
@router.get("/service-requests", response_model=List[ServiceRequestResponse])
def get_all_service_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get all service requests with pagination"""
    requests = db.query(ServiceRequest).order_by(ServiceRequest.created_at.desc()).offset(skip).limit(limit).all()
    
    response = []
    for req in requests:
        response.append(ServiceRequestResponse(
            id=req.id,
            full_name=req.full_name,
            email=req.email,
            phone_number=req.phone_number,
            organization_name=req.organization_name,
            country=req.country,
            industry_sector=req.industry_sector,
            additional_notes=req.additional_notes,
            status=req.status,
            services=[s.service_name for s in req.services],
            created_at=req.created_at,
            updated_at=req.updated_at,
            contract_confirmed_at=req.contract_confirmed_at
        ))
    
    return response

@router.get("/service-requests/{request_id}", response_model=ServiceRequestResponse)
def get_service_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get a specific service request by ID"""
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )
    
    return ServiceRequestResponse(
        id=req.id,
        full_name=req.full_name,
        email=req.email,
        phone_number=req.phone_number,
        organization_name=req.organization_name,
        country=req.country,
        industry_sector=req.industry_sector,
        additional_notes=req.additional_notes,
        status=req.status,
        services=[s.service_name for s in req.services],
        created_at=req.created_at,
        updated_at=req.updated_at,
        contract_confirmed_at=req.contract_confirmed_at
    )

@router.patch("/service-requests/{request_id}/status", response_model=ServiceRequestResponse)
def update_service_request_status(
    request_id: int,
    status_update: ServiceRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Update the status of a service request"""
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )
    
    # Validate status
    valid_statuses = ["new_inquiry", "qualified", "proposal_sent", "negotiation", "confirmed_contract", "cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    req.status = status_update.status
    
    # Set contract_confirmed_at if status is confirmed_contract
    if status_update.status == "confirmed_contract" and not req.contract_confirmed_at:
        req.contract_confirmed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(req)
    
    # Auto-trigger feedback email when service is completed
    if status_update.status == "confirmed_contract":
        try:
            service_names = ", ".join([s.service_name for s in req.services]) or "Cybersecurity Service"
            FeedbackService.create_feedback_token(
                db=db,
                email=req.email,
                full_name=req.full_name,
                feedback_type="service",
                request_id=req.id,
                service_name=service_names,
            )
        except Exception as e:
            # Don't fail the status update if email fails
            print(f"Warning: Failed to send feedback email: {e}")
    
    return ServiceRequestResponse(
        id=req.id,
        full_name=req.full_name,
        email=req.email,
        phone_number=req.phone_number,
        organization_name=req.organization_name,
        country=req.country,
        industry_sector=req.industry_sector,
        additional_notes=req.additional_notes,
        status=req.status,
        services=[s.service_name for s in req.services],
        created_at=req.created_at,
        updated_at=req.updated_at,
        contract_confirmed_at=req.contract_confirmed_at
    )

# Webinar Registration Management
@router.get("/webinar-registrations", response_model=List[WebinarRegistrationResponse])
def get_all_webinar_registrations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get all webinar registrations with pagination"""
    registrations = db.query(WebinarRegistration).order_by(WebinarRegistration.registered_at.desc()).offset(skip).limit(limit).all()
    
    response = []
    for reg in registrations:
        response.append(WebinarRegistrationResponse(
            id=reg.id,
            webinar_id=reg.webinar_id,
            full_name=reg.full_name,
            email=reg.email,
            phone_number=reg.phone_number,
            organization_name=reg.organization_name,
            country=reg.country,
            industry_sector=reg.industry_sector,
            registered_at=reg.registered_at,
            webinar_title=reg.webinar.title
        ))
    
    return response

# Customer Feedback
@router.post("/customer-feedback", response_model=CustomerFeedbackResponse, status_code=status.HTTP_201_CREATED)
def create_customer_feedback(
    feedback: CustomerFeedbackCreate,
    db: Session = Depends(get_db)
):
    """Create customer feedback (can be public or admin)"""
    # Validate service request exists if provided
    if feedback.service_request_id:
        req = db.query(ServiceRequest).filter(ServiceRequest.id == feedback.service_request_id).first()
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service request not found"
            )
    
    db_feedback = CustomerFeedback(
        service_request_id=feedback.service_request_id,
        rating=feedback.rating,
        comment=feedback.comment
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    return db_feedback
