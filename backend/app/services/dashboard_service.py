from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from datetime import datetime, timedelta
from typing import List
from app.models.service_request import ServiceRequest
from app.models.webinar import WebinarRegistration
from app.models.customer_feedback import CustomerFeedback
from app.schemas.dashboard import (
    DashboardSummary,
    MonthlyServiceRequest,
    IndustryDistribution,
    GeographicDistribution,
    ConversionFunnelStage,
    ConversionFunnel,
    RatingDistribution,
    CustomerSatisfactionMetrics
)

class DashboardService:
    
    @staticmethod
    def get_dashboard_summary(db: Session) -> DashboardSummary:
        """Get dashboard summary metrics"""
        # Total service requests
        total_requests = db.query(ServiceRequest).count()
        
        # Webinar registrations
        total_webinar_registrations = db.query(WebinarRegistration).count()
        
        # Conversion rate (completed / total requests)
        completed_requests = db.query(ServiceRequest).filter(
            ServiceRequest.status == "completed"
        ).count()
        conversion_rate = (completed_requests / total_requests * 100) if total_requests > 0 else 0
        
        # Average satisfaction
        avg_rating = db.query(func.avg(CustomerFeedback.rating)).scalar()
        avg_satisfaction = float(avg_rating) if avg_rating else 0.0
        
        # Calculate changes (comparing to previous month)
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # Previous month calculations
        prev_month = current_month - 1 if current_month > 1 else 12
        prev_year = current_year if current_month > 1 else current_year - 1
        
        # Service requests change
        current_month_requests = db.query(ServiceRequest).filter(
            extract('month', ServiceRequest.created_at) == current_month,
            extract('year', ServiceRequest.created_at) == current_year
        ).count()
        
        prev_month_requests = db.query(ServiceRequest).filter(
            extract('month', ServiceRequest.created_at) == prev_month,
            extract('year', ServiceRequest.created_at) == prev_year
        ).count()
        
        change_requests = ((current_month_requests - prev_month_requests) / prev_month_requests * 100) if prev_month_requests > 0 else 0
        
        # Webinar registrations change
        current_month_webinars = db.query(WebinarRegistration).filter(
            extract('month', WebinarRegistration.registered_at) == current_month,
            extract('year', WebinarRegistration.registered_at) == current_year
        ).count()
        
        prev_month_webinars = db.query(WebinarRegistration).filter(
            extract('month', WebinarRegistration.registered_at) == prev_month,
            extract('year', WebinarRegistration.registered_at) == prev_year
        ).count()
        
        change_webinars = ((current_month_webinars - prev_month_webinars) / prev_month_webinars * 100) if prev_month_webinars > 0 else 0
        
        return DashboardSummary(
            total_service_requests=total_requests,
            webinar_registrations=total_webinar_registrations,
            conversion_rate=round(conversion_rate, 1),
            avg_satisfaction=round(avg_satisfaction, 1),
            change_service_requests=round(change_requests, 1),
            change_webinar_registrations=round(change_webinars, 1),
            change_conversion_rate=5.0,  # Placeholder - would need historical data
            change_satisfaction=0.2  # Placeholder - would need historical data
        )
    
    @staticmethod
    def get_monthly_service_requests(db: Session) -> List[MonthlyServiceRequest]:
        """Get service requests grouped by month for the last 12 months"""
        # Get data for last 12 months
        twelve_months_ago = datetime.now() - timedelta(days=365)
        
        results = db.query(
            extract('year', ServiceRequest.created_at).label('year'),
            extract('month', ServiceRequest.created_at).label('month'),
            func.count(ServiceRequest.id).label('count')
        ).filter(
            ServiceRequest.created_at >= twelve_months_ago
        ).group_by('year', 'month').order_by('year', 'month').all()
        
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        monthly_data = []
        for result in results:
            monthly_data.append(MonthlyServiceRequest(
                month=month_names[int(result.month) - 1],
                count=result.count,
                year=int(result.year)
            ))
        
        return monthly_data
    
    @staticmethod
    def get_industry_distribution(db: Session) -> List[IndustryDistribution]:
        """Get service requests grouped by industry"""
        total_requests = db.query(ServiceRequest).count()
        
        results = db.query(
            ServiceRequest.industry_sector,
            func.count(ServiceRequest.id).label('count')
        ).group_by(ServiceRequest.industry_sector).all()
        
        distribution = []
        for result in results:
            percentage = (result.count / total_requests * 100) if total_requests > 0 else 0
            distribution.append(IndustryDistribution(
                industry=result.industry_sector,
                count=result.count,
                percentage=round(percentage, 1)
            ))
        
        # Sort by count descending
        distribution.sort(key=lambda x: x.count, reverse=True)
        return distribution
    
    @staticmethod
    def get_geographic_distribution(db: Session) -> List[GeographicDistribution]:
        """Get service requests grouped by country"""
        results = db.query(
            ServiceRequest.country,
            func.count(ServiceRequest.id).label('count')
        ).group_by(ServiceRequest.country).order_by(func.count(ServiceRequest.id).desc()).all()
        
        distribution = []
        for result in results:
            distribution.append(GeographicDistribution(
                country=result.country,
                count=result.count
            ))
        
        return distribution
    
    @staticmethod
    def get_conversion_funnel(db: Session) -> ConversionFunnel:
        """Get conversion funnel metrics based on service request progression"""
        total_requests = db.query(ServiceRequest).count()
        
        # Submitted = all requests (everything starts as submitted)
        submitted_count = total_requests
        
        # Reviewed = requests that moved past submitted (reviewed, in_progress, completed)
        reviewed_count = db.query(ServiceRequest).filter(
            ServiceRequest.status.in_(['reviewed', 'in_progress', 'completed'])
        ).count()
        
        # In Progress = requests actively being worked on (in_progress, completed)
        in_progress_count = db.query(ServiceRequest).filter(
            ServiceRequest.status.in_(['in_progress', 'completed'])
        ).count()
        
        # Completed = fully completed requests
        completed_count = db.query(ServiceRequest).filter(
            ServiceRequest.status == 'completed'
        ).count()
        
        conversion_rate = round((completed_count / total_requests * 100) if total_requests > 0 else 0, 1)
        
        stages = [
            ConversionFunnelStage(
                label="Submitted",
                count=submitted_count,
                percentage=100.0
            ),
            ConversionFunnelStage(
                label="Reviewed",
                count=reviewed_count,
                percentage=round((reviewed_count / total_requests * 100) if total_requests > 0 else 0, 1)
            ),
            ConversionFunnelStage(
                label="In Progress",
                count=in_progress_count,
                percentage=round((in_progress_count / total_requests * 100) if total_requests > 0 else 0, 1)
            ),
            ConversionFunnelStage(
                label="Completed",
                count=completed_count,
                percentage=round((completed_count / total_requests * 100) if total_requests > 0 else 0, 1)
            )
        ]
        
        return ConversionFunnel(
            total_requests=total_requests,
            stages=stages,
            conversion_rate=conversion_rate
        )
    
    @staticmethod
    def get_customer_satisfaction(db: Session) -> CustomerSatisfactionMetrics:
        """Get customer satisfaction metrics"""
        # Average rating
        avg_rating = db.query(func.avg(CustomerFeedback.rating)).scalar()
        average_rating = float(avg_rating) if avg_rating else 0.0
        
        # Total reviews
        total_reviews = db.query(CustomerFeedback).count()
        
        # Rating distribution
        distribution = []
        for stars in [5, 4, 3, 2, 1]:
            count = db.query(CustomerFeedback).filter(CustomerFeedback.rating == stars).count()
            distribution.append(RatingDistribution(stars=stars, count=count))
        
        return CustomerSatisfactionMetrics(
            average_rating=round(average_rating, 1),
            total_reviews=total_reviews,
            rating_distribution=distribution
        )
