from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app.database import get_db
from app.models.service_request import ServiceRequest, ServiceRequestService
from app.models.webinar import Webinar, WebinarRegistration
from app.schemas.service_request import ServiceRequestCreate, ServiceRequestResponse
from app.schemas.webinar import WebinarResponse, WebinarRegistrationCreate, WebinarRegistrationResponse
from app.services.feedback_service import FeedbackService

router = APIRouter()

@router.post("/service-requests", response_model=ServiceRequestResponse, status_code=status.HTTP_201_CREATED)
def create_service_request(request: ServiceRequestCreate, db: Session = Depends(get_db)):
    """Create a new service request (public endpoint)"""
    try:
        # Create service request
        db_request = ServiceRequest(
            full_name=request.full_name,
            email=request.email,
            phone_number=request.phone_number,
            organization_name=request.organization_name,
            country=request.country,
            industry_sector=request.industry_sector,
            additional_notes=request.additional_notes,
            status="new_inquiry"
        )
        db.add(db_request)
        db.flush()  # Get the ID without committing
        
        # Add selected services
        for service_name in request.services:
            db_service = ServiceRequestService(
                service_request_id=db_request.id,
                service_name=service_name
            )
            db.add(db_service)
        
        db.commit()
        db.refresh(db_request)
        
        # Build response with services
        response_data = ServiceRequestResponse(
            id=db_request.id,
            full_name=db_request.full_name,
            email=db_request.email,
            phone_number=db_request.phone_number,
            organization_name=db_request.organization_name,
            country=db_request.country,
            industry_sector=db_request.industry_sector,
            additional_notes=db_request.additional_notes,
            status=db_request.status,
            services=[s.service_name for s in db_request.services],
            created_at=db_request.created_at,
            updated_at=db_request.updated_at,
            contract_confirmed_at=db_request.contract_confirmed_at
        )
        
        return response_data
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating service request: {str(e)}"
        )

@router.get("/webinars", response_model=List[WebinarResponse])
def get_webinars(db: Session = Depends(get_db)):
    """Get all webinars with registration counts (public endpoint)"""
    webinars = db.query(Webinar).all()
    
    response = []
    for webinar in webinars:
        response.append(WebinarResponse(
            id=webinar.id,
            title=webinar.title,
            description=webinar.description,
            event_type=webinar.event_type,
            event_date=webinar.event_date,
            event_time=webinar.event_time,
            timezone=webinar.timezone,
            price=webinar.price,
            capacity=webinar.capacity,
            banner_gradient=webinar.banner_gradient,
            tag_color=webinar.tag_color,
            registration_count=len(webinar.registrations),
            created_at=webinar.created_at
        ))
    
    return response

@router.post("/webinar-registrations", response_model=WebinarRegistrationResponse, status_code=status.HTTP_201_CREATED)
def create_webinar_registration(registration: WebinarRegistrationCreate, db: Session = Depends(get_db)):
    """Register for a webinar (public endpoint)"""
    # Check if webinar exists
    webinar = db.query(Webinar).filter(Webinar.id == registration.webinar_id).first()
    if not webinar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webinar not found"
        )
    
    # Check capacity
    if webinar.capacity is not None:
        current_registrations = len(webinar.registrations)
        if current_registrations >= webinar.capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Webinar is at full capacity"
            )
    
    try:
        # Create registration
        db_registration = WebinarRegistration(
            webinar_id=registration.webinar_id,
            full_name=registration.full_name,
            email=registration.email,
            phone_number=registration.phone_number,
            organization_name=registration.organization_name,
            country=registration.country,
            industry_sector=registration.industry_sector
        )
        db.add(db_registration)
        db.commit()
        db.refresh(db_registration)
        
        # Build response
        response_data = WebinarRegistrationResponse(
            id=db_registration.id,
            webinar_id=db_registration.webinar_id,
            full_name=db_registration.full_name,
            email=db_registration.email,
            phone_number=db_registration.phone_number,
            organization_name=db_registration.organization_name,
            country=db_registration.country,
            industry_sector=db_registration.industry_sector,
            registered_at=db_registration.registered_at,
            webinar_title=webinar.title
        )
        
        # Send feedback request email for the webinar
        try:
            FeedbackService.create_feedback_token(
                db=db,
                email=registration.email,
                full_name=registration.full_name,
                feedback_type="webinar",
                webinar_id=webinar.id,
                webinar_title=webinar.title,
            )
        except Exception as e:
            # Don't fail registration if email fails
            print(f"Warning: Failed to send feedback email: {e}")
        
        return response_data
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already registered for this webinar"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating registration: {str(e)}"
        )
