def test_login_success(client, test_user):
    r = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "TestPass1"})
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert r.json()["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    r = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert r.status_code == 401


def test_get_me(client, auth_headers):
    r = client.get("/api/v1/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"


def test_refresh_token(client, test_user):
    login = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "TestPass1"})
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": login.json()["refresh_token"]})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_logout(client, auth_headers):
    r = client.post("/api/v1/auth/logout", headers=auth_headers)
    assert r.status_code == 200


def test_forgot_password_always_200(client):
    r = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
    assert r.status_code == 200


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"
