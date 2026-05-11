from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.security import get_current_admin
from app.models.admin_user import AdminUser
from app.models.service_request import ServiceRequest, ServiceRequestService
from app.models.webinar import Webinar, WebinarRegistration
from app.models.customer_feedback import CustomerFeedback
from app.schemas.service_request import ServiceRequestResponse, ServiceRequestStatusUpdate
from app.schemas.webinar import WebinarResponse, WebinarRegistrationResponse, WebinarCreate, WebinarUpdate
from app.schemas.dashboard import (
    DashboardSummary,
    MonthlyServiceRequest,
    IndustryDistribution,
    GeographicDistribution,
    ConversionFunnel,
    CustomerSatisfactionMetrics
)
from app.schemas.customer_feedback import CustomerFeedbackCreate, CustomerFeedbackResponse
from app.schemas.activity_log import ActivityLogResponse
from app.services.dashboard_service import DashboardService
from app.services.feedback_service import FeedbackService
from app.services.activity_service import log_activity
from app.models.activity_log import ActivityLog

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
    valid_statuses = ["submitted", "reviewed", "in_progress", "completed"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    req.status = status_update.status
    
    # Set contract_confirmed_at if status is completed
    if status_update.status == "completed" and not req.contract_confirmed_at:
        req.contract_confirmed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(req)

    # Log status change activity
    log_activity(
        db=db,
        activity_type="status_update",
        title=f"Service request status updated to {status_update.status.replace('_', ' ')}",
        details=f"{req.full_name} - {req.organization_name}",
        actor_name=current_admin.email,
        reference_id=req.id,
    )
    
    # Auto-trigger feedback email when service is completed
    if status_update.status == "completed":
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
            webinar_title=reg.webinar.title,
            webinar_type=reg.webinar.event_type
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

# Activity Log
@router.get("/activity-log", response_model=List[ActivityLogResponse])
def get_activity_log(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Get recent activity log entries"""
    activities = db.query(ActivityLog).order_by(
        ActivityLog.created_at.desc()
    ).offset(skip).limit(limit).all()
    return activities

# Webinar Management (Admin CRUD)
@router.post("/webinars", response_model=WebinarResponse, status_code=status.HTTP_201_CREATED)
def create_webinar(
    webinar: WebinarCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Create a new webinar (admin only)"""
    db_webinar = Webinar(
        title=webinar.title,
        description=webinar.description,
        event_type=webinar.event_type,
        event_date=webinar.event_date,
        event_time=webinar.event_time,
        timezone=webinar.timezone,
        price=webinar.price,
        capacity=webinar.capacity,
        banner_gradient=webinar.banner_gradient,
        tag_color=webinar.tag_color
    )
    db.add(db_webinar)
    db.commit()
    db.refresh(db_webinar)
    
    log_activity(
        db=db,
        activity_type="webinar_created",
        title="New webinar created",
        details=f"{webinar.title} - {webinar.event_date}",
        actor_name=current_admin.email,
        reference_id=db_webinar.id,
    )
    
    return WebinarResponse(
        id=db_webinar.id,
        title=db_webinar.title,
        description=db_webinar.description,
        event_type=db_webinar.event_type,
        event_date=db_webinar.event_date,
        event_time=db_webinar.event_time,
        timezone=db_webinar.timezone,
        price=db_webinar.price,
        capacity=db_webinar.capacity,
        banner_gradient=db_webinar.banner_gradient,
        tag_color=db_webinar.tag_color,
        registration_count=0,
        created_at=db_webinar.created_at
    )

@router.put("/webinars/{webinar_id}", response_model=WebinarResponse)
def update_webinar(
    webinar_id: int,
    webinar: WebinarUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Update an existing webinar (admin only)"""
    db_webinar = db.query(Webinar).filter(Webinar.id == webinar_id).first()
    if not db_webinar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webinar not found"
        )
    
    # Update only provided fields
    update_data = webinar.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_webinar, field, value)
    
    db.commit()
    db.refresh(db_webinar)
    
    log_activity(
        db=db,
        activity_type="webinar_updated",
        title="Webinar updated",
        details=f"{db_webinar.title}",
        actor_name=current_admin.email,
        reference_id=db_webinar.id,
    )
    
    return WebinarResponse(
        id=db_webinar.id,
        title=db_webinar.title,
        description=db_webinar.description,
        event_type=db_webinar.event_type,
        event_date=db_webinar.event_date,
        event_time=db_webinar.event_time,
        timezone=db_webinar.timezone,
        price=db_webinar.price,
        capacity=db_webinar.capacity,
        banner_gradient=db_webinar.banner_gradient,
        tag_color=db_webinar.tag_color,
        registration_count=len(db_webinar.registrations),
        created_at=db_webinar.created_at
    )

@router.delete("/webinars/{webinar_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_webinar(
    webinar_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Delete a webinar (admin only)"""
    db_webinar = db.query(Webinar).filter(Webinar.id == webinar_id).first()
    if not db_webinar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webinar not found"
        )
    
    webinar_title = db_webinar.title
    
    # Delete associated registrations first (cascade should handle this, but being explicit)
    db.query(WebinarRegistration).filter(WebinarRegistration.webinar_id == webinar_id).delete()
    
    db.delete(db_webinar)
    db.commit()
    
    log_activity(
        db=db,
        activity_type="webinar_deleted",
        title="Webinar deleted",
        details=f"{webinar_title}",
        actor_name=current_admin.email,
        reference_id=webinar_id,
    )
    
    return None
