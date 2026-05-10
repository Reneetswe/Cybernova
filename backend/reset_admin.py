"""Reset or create admin user with a fresh password hash."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.admin_user import AdminUser
from app.core.security import get_password_hash, verify_password

def reset_admin():
    db = SessionLocal()
    try:
        email = "admin@cybernova.com"
        password = "Admin@123"

        new_hash = get_password_hash(password)
        print(f"New hash: {new_hash}")

        admin = db.query(AdminUser).filter(AdminUser.email == email).first()

        if admin:
            admin.password_hash = new_hash
            db.commit()
            print(f"Updated password for existing admin: {email}")
        else:
            admin = AdminUser(
                full_name="CyberNova Admin",
                email=email,
                password_hash=new_hash
            )
            db.add(admin)
            db.commit()
            print(f"Created new admin user: {email}")

        # Verify it works
        test = verify_password(password, new_hash)
        print(f"Password verification test: {'PASSED' if test else 'FAILED'}")
        print(f"\nLogin with: {email} / {password}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
