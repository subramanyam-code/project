"""
Run this ONCE to create the first super_admin user.

Usage:
    cd backend
    python seed_admin.py

    # Or with custom credentials:
    python seed_admin.py --email admin@company.com --password MyPass123 --first "John" --last "Doe"
"""

import argparse
import sys
import os

# Make sure backend app is importable
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database.session import SessionLocal
from app.auth.password import hash_password

DEFAULT_EMAIL    = "admin@tspm.com"
DEFAULT_PASSWORD = "Admin@1234"
DEFAULT_FIRST    = "Super"
DEFAULT_LAST     = "Admin"


def seed(email: str, password: str, first_name: str, last_name: str):
    db = SessionLocal()
    try:
        # Check if super_admin role exists
        role = db.execute(
            text("SELECT id FROM roles WHERE role_name = 'super_admin' LIMIT 1")
        ).fetchone()

        if not role:
            print("ERROR: Roles not found. Run migrations first:")
            print("  alembic upgrade head")
            sys.exit(1)

        role_id = role[0]

        # Check if this email already exists
        existing = db.execute(
            text("SELECT id, email FROM users WHERE email = :email"),
            {"email": email}
        ).fetchone()

        if existing:
            print(f"User '{email}' already exists. Nothing to do.")
            print(f"\nYou can log in with:")
            print(f"  Email:    {email}")
            print(f"  Password: (whatever you set previously)")
            return

        # Create the super admin
        hashed = hash_password(password)
        db.execute(text("""
            INSERT INTO users
                (id, first_name, last_name, email, hashed_password,
                 role_id, is_active, is_verified, created_at, updated_at)
            VALUES
                (gen_random_uuid(), :first, :last, :email, :hashed,
                 :role_id, true, true, now(), now())
        """), {
            "first":   first_name,
            "last":    last_name,
            "email":   email,
            "hashed":  hashed,
            "role_id": role_id,
        })
        db.commit()

        print("=" * 50)
        print("Super Admin created successfully!")
        print("=" * 50)
        print(f"  Email:    {email}")
        print(f"  Password: {password}")
        print(f"  Name:     {first_name} {last_name}")
        print("=" * 50)
        print("Go to your app and log in with these credentials.")
        print("Change your password after first login!")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the first super admin user")
    parser.add_argument("--email",    default=DEFAULT_EMAIL,    help=f"Admin email (default: {DEFAULT_EMAIL})")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help=f"Admin password (default: {DEFAULT_PASSWORD})")
    parser.add_argument("--first",    default=DEFAULT_FIRST,    help=f"First name (default: {DEFAULT_FIRST})")
    parser.add_argument("--last",     default=DEFAULT_LAST,     help=f"Last name (default: {DEFAULT_LAST})")
    args = parser.parse_args()
    seed(args.email, args.password, args.first, args.last)
