import re
from pydantic import BaseModel, EmailStr, field_validator
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

    @field_validator('full_name')
    @classmethod
    def name_must_be_letters(cls, v: str) -> str:
        if not re.match(r"^[A-Za-z\s'\-]+$", v.strip()):
            raise ValueError('Full name must contain only letters, spaces, hyphens or apostrophes')
        return v.strip()

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
    webinar_type: Optional[str] = None
    feedback_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class WebinarCreate(BaseModel):
    title: str
    description: str
    event_type: str
    event_date: str
    event_time: str
    timezone: str
    price: Optional[Decimal] = None
    capacity: Optional[int] = None
    banner_gradient: Optional[str] = None
    tag_color: Optional[str] = None

class WebinarUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    timezone: Optional[str] = None
    price: Optional[Decimal] = None
    capacity: Optional[int] = None
    banner_gradient: Optional[str] = None
    tag_color: Optional[str] = None
