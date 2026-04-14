from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.admin_user import AdminUser
from app.models.webinar import Webinar
from app.models.customer_feedback import CustomerFeedback
from app.core.security import get_password_hash
from decimal import Decimal

def seed_admin_user(db: Session):
    """Seed admin user"""
    # Check if admin already exists
    existing_admin = db.query(AdminUser).filter(AdminUser.email == "admin@cybernova.com").first()
    if existing_admin:
        print("Admin user already exists")
        return
    
    admin = AdminUser(
        full_name="CyberNova Admin",
        email="admin@cybernova.com",
        password_hash=get_password_hash("Admin@123")
    )
    db.add(admin)
    db.commit()
    print("Admin user created: admin@cybernova.com / Admin@123")

def seed_webinars(db: Session):
    """Seed webinar events matching the UI"""
    # Check if webinars already exist
    existing_count = db.query(Webinar).count()
    if existing_count > 0:
        print(f"{existing_count} webinars already exist")
        return
    
    webinars = [
        Webinar(
            title="Ransomware Defence Strategies for African SMEs",
            description="Understand how modern ransomware operates and implement proven defences without enterprise budgets.",
            event_type="Webinar",
            event_date="15 July 2025",
            event_time="10:00 WAT",
            timezone="WAT",
            price=None,  # Free
            capacity=None,  # Unlimited
            banner_gradient="linear-gradient(90deg, #00C9A7, #0088FF)",
            tag_color="rgba(0,136,255,0.1)"
        ),
        Webinar(
            title="Virtual Security Workshop: Phishing Simulation & Awareness",
            description="Interactive 3-hour workshop where your team participates in a live phishing exercise and debrief.",
            event_type="Workshop",
            event_date="22 July 2025",
            event_time="09:00 CAT",
            timezone="CAT",
            price=Decimal("250.00"),
            capacity=50,
            banner_gradient="linear-gradient(90deg, #0088FF, #00C9A7)",
            tag_color="rgba(0,201,167,0.1)"
        ),
        Webinar(
            title="SADC Cybersecurity Summit 2025 — Virtual Track",
            description="Join 800+ security professionals across Southern Africa for the region's premier cybersecurity event.",
            event_type="Live Event",
            event_date="5 August 2025",
            event_time="08:00 CAT",
            timezone="CAT",
            price=None,
            capacity=None,
            banner_gradient="linear-gradient(90deg, #FF6B35, #FF9500)",
            tag_color="rgba(255,107,53,0.1)"
        ),
        Webinar(
            title="AI in Cybersecurity: Opportunities & Threats for 2026",
            description="How AI is being weaponised by attackers — and how defenders can harness it first. Includes Q&A.",
            event_type="Webinar",
            event_date="19 August 2025",
            event_time="14:00 CAT",
            timezone="CAT",
            price=None,
            capacity=None,
            banner_gradient="linear-gradient(90deg, #9B59B6, #0088FF)",
            tag_color="rgba(155,89,182,0.1)"
        )
    ]
    
    for webinar in webinars:
        db.add(webinar)
    
    db.commit()
    print(f"Seeded {len(webinars)} webinars")

def seed_sample_feedback(db: Session):
    """Seed some sample customer feedback for dashboard display"""
    existing_count = db.query(CustomerFeedback).count()
    if existing_count > 0:
        print(f"{existing_count} feedback records already exist")
        return
    
    # Create sample feedback (not linked to service requests)
    feedback_data = [
        (5, "Excellent service! Very professional and thorough."),
        (5, "Great experience, highly recommend."),
        (5, "Outstanding support and expertise."),
        (4, "Very good service, minor delays but overall satisfied."),
        (4, "Professional team, good results."),
        (3, "Average experience, could be better."),
        (2, "Not satisfied with the response time."),
        (1, "Poor communication."),
    ]
    
    for rating, comment in feedback_data:
        feedback = CustomerFeedback(
            service_request_id=None,
            rating=rating,
            comment=comment
        )
        db.add(feedback)
    
    db.commit()
    print(f"Seeded {len(feedback_data)} feedback records")

def run_seed():
    """Run all seed functions"""
    db = SessionLocal()
    try:
        print("Starting database seeding...")
        seed_admin_user(db)
        seed_webinars(db)
        seed_sample_feedback(db)
        print("Database seeding completed!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
