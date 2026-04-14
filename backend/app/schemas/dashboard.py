from pydantic import BaseModel
from typing import List

class DashboardSummary(BaseModel):
    total_service_requests: int
    webinar_registrations: int
    conversion_rate: float
    avg_satisfaction: float
    change_service_requests: float
    change_webinar_registrations: float
    change_conversion_rate: float
    change_satisfaction: float

class MonthlyServiceRequest(BaseModel):
    month: str
    count: int
    year: int

class IndustryDistribution(BaseModel):
    industry: str
    count: int
    percentage: float

class GeographicDistribution(BaseModel):
    country: str
    count: int

class ConversionFunnelStage(BaseModel):
    label: str
    count: int
    percentage: float

class ConversionFunnel(BaseModel):
    stages: List[ConversionFunnelStage]

class RatingDistribution(BaseModel):
    stars: int
    count: int

class CustomerSatisfactionMetrics(BaseModel):
    average_rating: float
    total_reviews: int
    rating_distribution: List[RatingDistribution]
