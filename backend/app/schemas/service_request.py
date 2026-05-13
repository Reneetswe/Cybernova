import re
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import List, Optional

class ServiceRequestCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    organization_name: str
    country: str
    industry_sector: str
    services: List[str]
    additional_notes: Optional[str] = None

    @field_validator('full_name')
    @classmethod
    def name_must_be_letters(cls, v: str) -> str:
        if not re.match(r"^[A-Za-z\s'\-]+$", v.strip()):
            raise ValueError('Full name must contain only letters, spaces, hyphens or apostrophes')
        return v.strip()

class ServiceRequestResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: Optional[str]
    organization_name: str
    country: str
    industry_sector: str
    additional_notes: Optional[str]
    status: str
    services: List[str]
    created_at: datetime
    updated_at: datetime
    contract_confirmed_at: Optional[datetime]
    feedback_url: Optional[str] = None

    class Config:
        from_attributes = True

class ServiceRequestUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    organization_name: Optional[str] = None
    country: Optional[str] = None
    industry_sector: Optional[str] = None
    additional_notes: Optional[str] = None
    status: Optional[str] = None

    @field_validator('full_name')
    @classmethod
    def name_must_be_letters(cls, v):
        if v is not None and not re.match(r"^[A-Za-z\s'\-]+$", v.strip()):
            raise ValueError('Full name must contain only letters, spaces, hyphens or apostrophes')
        return v.strip() if v else v

class ServiceRequestStatusUpdate(BaseModel):
    status: str  # submitted, reviewed, in_progress, completed
