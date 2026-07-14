import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.base import Base
from app.database.session import get_db
from app.models.role import Role
from app.models.user import User
from app.auth.password import hash_password

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def employee_role(db):
    r = Role(role_name="employee", description="Employee")
    db.add(r); db.commit(); db.refresh(r)
    return r


@pytest.fixture
def test_user(db, employee_role):
    u = User(first_name="Test", last_name="User", email="test@example.com",
             hashed_password=hash_password("TestPass1"), role_id=employee_role.id, is_active=True)
    db.add(u); db.commit(); db.refresh(u)
    return u


@pytest.fixture
def auth_headers(client, test_user):
    r = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "TestPass1"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
