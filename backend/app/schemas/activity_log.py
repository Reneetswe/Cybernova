from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ActivityLogResponse(BaseModel):
    id: int
    activity_type: str
    title: str
    details: Optional[str]
    actor_name: Optional[str]
    actor_email: Optional[str]
    reference_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
