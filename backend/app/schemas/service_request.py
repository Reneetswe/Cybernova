from pydantic import BaseModel, EmailStr
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

class ServiceRequestStatusUpdate(BaseModel):
    status: str  # new_inquiry, qualified, proposal_sent, negotiation, confirmed_contract, cancelled
