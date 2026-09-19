import pytest

pytestmark = pytest.mark.asyncio


async def _vendor_token(client, email="products-vendor@example.com"):
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Vendor", "password": "supersecret123", "role": "vendor"},
    )
    return res.json()["access_token"]


async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_list_products_default_pagination(client):
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_create_product_rejects_negative_price(client):
    token = await _vendor_token(client)
    payload = {"name": "Test Item", "price": -5, "stock_quantity": 10}
    response = await client.post(
        "/api/v1/products",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422  # validation catches invalid price