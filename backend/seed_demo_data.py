"""Seed 10 service requests and 10 webinar registrations for demo purposes."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.service_request import ServiceRequest, ServiceRequestService
from app.models.webinar import Webinar, WebinarRegistration
from app.models.activity_log import ActivityLog

SERVICE_REQUESTS = [
    {
        "full_name": "Thabo Nkosi",
        "email": "thabo.nkosi@fnb.co.bw",
        "phone_number": "+267 71 234 567",
        "organization_name": "First National Bank Botswana",
        "country": "Botswana",
        "industry_sector": "Banking & Financial Services",
        "additional_notes": "We need a comprehensive review of our online banking security.",
        "status": "reviewed",
        "services": ["Network Security Audit", "Penetration Testing"],
    },
    {
        "full_name": "Amara Diallo",
        "email": "amara.diallo@govzw.gov.zw",
        "phone_number": "+263 77 456 789",
        "organization_name": "Ministry of ICT Zimbabwe",
        "country": "Zimbabwe",
        "industry_sector": "Government & Public Sector",
        "additional_notes": "Looking to assess our national infrastructure for cyber vulnerabilities.",
        "status": "in_progress",
        "services": ["Network Security Audit", "AI Cyber Assistant", "Schedule Consultation"],
    },
    {
        "full_name": "Lindiwe Dube",
        "email": "l.dube@medicare.co.za",
        "phone_number": "+27 82 345 678",
        "organization_name": "MediCare Health Group",
        "country": "South Africa",
        "industry_sector": "Healthcare",
        "additional_notes": "Patient data protection and POPIA compliance is our main concern.",
        "status": "submitted",
        "services": ["Penetration Testing", "Cyber Awareness Webinar"],
    },
    {
        "full_name": "Sipho Zulu",
        "email": "sipho@shoprite.co.za",
        "phone_number": "+27 73 567 890",
        "organization_name": "Shoprite Holdings",
        "country": "South Africa",
        "industry_sector": "Retail & E-commerce",
        "additional_notes": "We have multiple POS systems across 500 stores that need securing.",
        "status": "in_progress",
        "services": ["AI Cyber Assistant", "Network Security Audit"],
    },
    {
        "full_name": "Fatima Mokoena",
        "email": "fatima.m@mascom.bw",
        "phone_number": "+267 74 678 901",
        "organization_name": "Mascom Wireless",
        "country": "Botswana",
        "industry_sector": "Telecommunications",
        "additional_notes": "Need to secure our core network infrastructure and customer data.",
        "status": "completed",
        "services": ["Network Security Audit", "Penetration Testing", "AI Cyber Assistant"],
    },
    {
        "full_name": "Kwame Asante",
        "email": "k.asante@ug.edu.gh",
        "phone_number": "+233 24 789 012",
        "organization_name": "University of Ghana",
        "country": "Ghana",
        "industry_sector": "Education",
        "additional_notes": "Staff and student cyber awareness training required.",
        "status": "submitted",
        "services": ["Cyber Awareness Webinar", "Schedule Consultation"],
    },
    {
        "full_name": "Naledi Setshogo",
        "email": "naledi@debswana.co.bw",
        "phone_number": "+267 75 890 123",
        "organization_name": "Debswana Diamond Company",
        "country": "Botswana",
        "industry_sector": "Mining & Resources",
        "additional_notes": "Operational technology (OT) and IT convergence security required.",
        "status": "reviewed",
        "services": ["Penetration Testing", "Network Security Audit", "Schedule Consultation"],
    },
    {
        "full_name": "Emmanuel Okafor",
        "email": "e.okafor@dangote.com",
        "phone_number": "+234 80 901 234",
        "organization_name": "Dangote Logistics",
        "country": "Nigeria",
        "industry_sector": "Logistics & Transport",
        "additional_notes": "Fleet tracking systems and supply chain data protection.",
        "status": "in_progress",
        "services": ["AI Cyber Assistant", "Penetration Testing"],
    },
    {
        "full_name": "Zanele Mthembu",
        "email": "zanele@techstartbw.com",
        "phone_number": "+267 76 012 345",
        "organization_name": "TechStart Botswana",
        "country": "Botswana",
        "industry_sector": "SME (General)",
        "additional_notes": "Small startup needing affordable baseline security assessment.",
        "status": "submitted",
        "services": ["Schedule Consultation", "Cyber Awareness Webinar"],
    },
    {
        "full_name": "Molebogeng Tau",
        "email": "m.tau@africom.co.bw",
        "phone_number": "+267 77 123 456",
        "organization_name": "AfriCom Solutions",
        "country": "Botswana",
        "industry_sector": "Telecommunications",
        "additional_notes": "Require a full penetration test report for our board presentation.",
        "status": "completed",
        "services": ["Penetration Testing", "Network Security Audit"],
    },
]

WEBINAR_REGISTRATIONS = [
    {
        "full_name": "Kabo Seretse",
        "email": "kabo.seretse@gmail.com",
        "phone_number": "+267 71 111 222",
        "organization_name": "Barclays Botswana",
        "country": "Botswana",
        "industry_sector": "Banking & Financial Services",
    },
    {
        "full_name": "Thandeka Nxumalo",
        "email": "t.nxumalo@outlook.com",
        "phone_number": "+27 82 222 333",
        "organization_name": "City of Johannesburg",
        "country": "South Africa",
        "industry_sector": "Government & Public Sector",
    },
    {
        "full_name": "Chidi Obi",
        "email": "chidi.obi@yahoo.com",
        "phone_number": "+234 80 333 444",
        "organization_name": "Lagos General Hospital",
        "country": "Nigeria",
        "industry_sector": "Healthcare",
    },
    {
        "full_name": "Aisha Kamara",
        "email": "aisha.kamara@gmail.com",
        "phone_number": "+232 76 444 555",
        "organization_name": "Freetown Retailers",
        "country": "Sierra Leone",
        "industry_sector": "Retail & E-commerce",
    },
    {
        "full_name": "Bongani Khumalo",
        "email": "b.khumalo@gmail.com",
        "phone_number": "+263 77 555 666",
        "organization_name": "Econet Wireless Zimbabwe",
        "country": "Zimbabwe",
        "industry_sector": "Telecommunications",
    },
    {
        "full_name": "Yaa Asantewaa",
        "email": "yaa.asantewaa@outlook.com",
        "phone_number": "+233 24 666 777",
        "organization_name": "Kumasi Polytechnic",
        "country": "Ghana",
        "industry_sector": "Education",
    },
    {
        "full_name": "Ofentse Rakhudu",
        "email": "ofentse.r@gmail.com",
        "phone_number": "+267 74 777 888",
        "organization_name": "BCL Mine",
        "country": "Botswana",
        "industry_sector": "Mining & Resources",
    },
    {
        "full_name": "Chioma Eze",
        "email": "chioma.eze@gmail.com",
        "phone_number": "+234 81 888 999",
        "organization_name": "GTL Express Nigeria",
        "country": "Nigeria",
        "industry_sector": "Logistics & Transport",
    },
    {
        "full_name": "Ntombi Dlamini",
        "email": "ntombi.d@gmail.com",
        "phone_number": "+268 76 999 000",
        "organization_name": "Dlamini & Associates",
        "country": "Eswatini",
        "industry_sector": "SME (General)",
    },
    {
        "full_name": "Refilwe Ntsimane",
        "email": "refilwe.n@gmail.com",
        "phone_number": "+267 75 000 111",
        "organization_name": "Orange Botswana",
        "country": "Botswana",
        "industry_sector": "Telecommunications",
    },
]


def seed_data():
    db = SessionLocal()
    try:
        # ── Service Requests ──────────────────────────────────────────
        existing_sr = db.query(ServiceRequest).count()
        if existing_sr >= 10:
            print(f"Service requests already seeded ({existing_sr} found). Skipping.")
        else:
            for data in SERVICE_REQUESTS:
                services = data.pop("services")
                sr = ServiceRequest(**data)
                db.add(sr)
                db.flush()
                for svc in services:
                    db.add(ServiceRequestService(service_request_id=sr.id, service_name=svc))
                data["services"] = services  # restore for re-use safety
            db.commit()
            print(f"Seeded {len(SERVICE_REQUESTS)} service requests.")

        # ── Webinar Registrations ─────────────────────────────────────
        # Get first available webinar
        webinar = db.query(Webinar).first()
        if not webinar:
            print("No webinars found. Please run the main seed first.")
            return

        existing_wr = db.query(WebinarRegistration).count()
        if existing_wr >= 10:
            print(f"Webinar registrations already seeded ({existing_wr} found). Skipping.")
        else:
            webinars = db.query(Webinar).all()
            for i, data in enumerate(WEBINAR_REGISTRATIONS):
                # Distribute registrations across webinars
                target_webinar = webinars[i % len(webinars)]
                reg = WebinarRegistration(webinar_id=target_webinar.id, **data)
                db.add(reg)
            db.commit()
            print(f"Seeded {len(WEBINAR_REGISTRATIONS)} webinar registrations.")

        # ── Activity Logs ──────────────────────────────────────────────
        existing_al = db.query(ActivityLog).count()
        if existing_al >= 5:
            print(f"Activity logs already seeded ({existing_al} found). Skipping.")
        else:
            from datetime import datetime, timedelta
            now = datetime.utcnow()
            activities = []
            # Log service request submissions
            for i, data in enumerate(SERVICE_REQUESTS):
                activities.append(ActivityLog(
                    activity_type="service_request",
                    title="New service request submitted",
                    details=f"{', '.join(data['services'])} - {data['organization_name']}",
                    actor_name=data["full_name"],
                    actor_email=data["email"],
                    created_at=now - timedelta(hours=len(SERVICE_REQUESTS) - i),
                ))
            # Log webinar registrations
            webinars_all = db.query(Webinar).all()
            for i, data in enumerate(WEBINAR_REGISTRATIONS):
                target_w = webinars_all[i % len(webinars_all)] if webinars_all else None
                activities.append(ActivityLog(
                    activity_type="webinar_registration",
                    title="New webinar registration",
                    details=f"{target_w.title if target_w else 'Webinar'} - {data['full_name']}",
                    actor_name=data["full_name"],
                    actor_email=data["email"],
                    created_at=now - timedelta(minutes=30 * (len(WEBINAR_REGISTRATIONS) - i)),
                ))
            # Log some status updates
            activities.append(ActivityLog(
                activity_type="status_update",
                title="Service request status updated to reviewed",
                details="Thabo Nkosi - First National Bank Botswana",
                actor_name="admin@cybernova.com",
                created_at=now - timedelta(hours=5),
            ))
            activities.append(ActivityLog(
                activity_type="status_update",
                title="Service request status updated to completed",
                details="Fatima Mokoena - Mascom Wireless",
                actor_name="admin@cybernova.com",
                created_at=now - timedelta(hours=3),
            ))
            activities.append(ActivityLog(
                activity_type="feedback",
                title="New satisfaction feedback submitted",
                details="Rating: 5/5 - Excellent service and very professional team.",
                actor_name="John Smith",
                actor_email="john@acmecorp.com",
                created_at=now - timedelta(hours=2),
            ))
            for a in activities:
                db.add(a)
            db.commit()
            print(f"Seeded {len(activities)} activity log entries.")

        print("\nAll demo data seeded successfully!")
        print("Login to the admin dashboard to see the data.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
