from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CustomerFeedbackCreate(BaseModel):
    service_request_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class CustomerFeedbackResponse(BaseModel):
    id: int
    service_request_id: Optional[int]
    rating: int
    comment: Optional[str]
    submitted_at: datetime
    
    class Config:
        from_attributes = True
