import pytest

pytestmark = pytest.mark.asyncio


async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_list_products_default_pagination(client):
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


async def test_create_product_rejects_negative_price(client):
    payload = {"name": "Test Item", "price": -5, "stock_quantity": 10}
    response = await client.post(
        "/api/v1/products",
        params={"vendor_id": "00000000-0000-0000-0000-000000000000"},
        json=payload,
    )
    assert response.status_code == 422  # validation catches invalid price
