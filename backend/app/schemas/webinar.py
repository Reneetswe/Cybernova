from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from decimal import Decimal

class WebinarResponse(BaseModel):
    id: int
    title: str
    description: str
    event_type: str
    event_date: str
    event_time: str
    timezone: str
    price: Optional[Decimal]
    capacity: Optional[int]
    banner_gradient: Optional[str]
    tag_color: Optional[str]
    registration_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class WebinarRegistrationCreate(BaseModel):
    webinar_id: int
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    organization_name: Optional[str] = None
    country: Optional[str] = None
    industry_sector: Optional[str] = None

class WebinarRegistrationResponse(BaseModel):
    id: int
    webinar_id: int
    full_name: str
    email: str
    phone_number: Optional[str]
    organization_name: Optional[str]
    country: Optional[str]
    industry_sector: Optional[str]
    registered_at: datetime
    webinar_title: str
    
    class Config:
        from_attributes = True
