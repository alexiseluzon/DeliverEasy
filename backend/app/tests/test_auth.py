import pytest


@pytest.mark.asyncio
async def test_register_returns_token(client):
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "vendor1@example.com",
            "full_name": "Vendor One",
            "password": "supersecret123",
            "role": "vendor",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["access_token"]
    assert body["user"]["email"] == "vendor1@example.com"
    assert body["user"]["role"] == "vendor"


@pytest.mark.asyncio
async def test_register_duplicate_email_rejected(client):
    payload = {
        "email": "dupe@example.com",
        "full_name": "Dupe User",
        "password": "supersecret123",
    }
    first = await client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = await client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_login_success_and_wrong_password(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "full_name": "Login User", "password": "correcthorse"},
    )

    ok = await client.post(
        "/api/v1/auth/login", json={"email": "login@example.com", "password": "correcthorse"}
    )
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    bad = await client.post(
        "/api/v1/auth/login", json={"email": "login@example.com", "password": "wrongpass"}
    )
    assert bad.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_token(client):
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_current_user(client):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "me@example.com", "full_name": "Me User", "password": "supersecret123"},
    )
    token = reg.json()["access_token"]

    res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_create_product_requires_vendor_role(client):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "cust@example.com", "full_name": "Customer", "password": "supersecret123"},
    )
    token = reg.json()["access_token"]

    res = await client.post(
        "/api/v1/products",
        json={"name": "Item", "price": "9.99", "stock_quantity": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403