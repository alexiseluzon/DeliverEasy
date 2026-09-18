import pytest


async def _register(client, email, role="customer"):
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": email, "password": "supersecret123", "role": role},
    )
    body = res.json()
    return body["access_token"], body["user"]["id"]


async def _make_product(client, vendor_token, price="10.00", stock=5):
    res = await client.post(
        "/api/v1/products",
        json={"name": "Widget", "price": price, "stock_quantity": stock},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    return res.json()["id"]


@pytest.mark.asyncio
async def test_customer_can_place_order(client):
    vendor_token, _ = await _register(client, "vendor@example.com", "vendor")
    product_id = await _make_product(client, vendor_token)
    customer_token, _ = await _register(client, "cust@example.com", "customer")

    res = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "123 Main St", "items": [{"product_id": product_id, "quantity": 2}]},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "pending"
    assert float(body["total_amount"]) == 20.0
    assert len(body["items"]) == 1


@pytest.mark.asyncio
async def test_order_rejects_insufficient_stock(client):
    vendor_token, _ = await _register(client, "vendor2@example.com", "vendor")
    product_id = await _make_product(client, vendor_token, stock=1)
    customer_token, _ = await _register(client, "cust2@example.com", "customer")

    res = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "1 Way", "items": [{"product_id": product_id, "quantity": 5}]},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_vendor_cannot_place_order(client):
    vendor_token, _ = await _register(client, "vendor3@example.com", "vendor")
    product_id = await _make_product(client, vendor_token)

    res = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "1 Way", "items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_customer_cannot_view_others_order(client):
    vendor_token, _ = await _register(client, "vendor4@example.com", "vendor")
    product_id = await _make_product(client, vendor_token)
    cust_a_token, _ = await _register(client, "custa@example.com", "customer")
    cust_b_token, _ = await _register(client, "custb@example.com", "customer")

    order_res = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "1 Way", "items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {cust_a_token}"},
    )
    order_id = order_res.json()["id"]

    res = await client.get(f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {cust_b_token}"})
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_status_transition_flow_and_rider_assignment(client):
    vendor_token, _ = await _register(client, "vendor5@example.com", "vendor")
    product_id = await _make_product(client, vendor_token)
    customer_token, _ = await _register(client, "cust5@example.com", "customer")
    rider_token, rider_id = await _register(client, "rider5@example.com", "rider")

    order_res = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "1 Way", "items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    order_id = order_res.json()["id"]

    confirm = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "confirmed"},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert confirm.status_code == 200
    assert confirm.json()["status"] == "confirmed"

    invalid = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "delivered"},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert invalid.status_code == 400

    preparing = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "preparing"},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    assert preparing.status_code == 200

    picked_up = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "out_for_delivery"},
        headers={"Authorization": f"Bearer {rider_token}"},
    )
    assert picked_up.status_code == 200
    assert picked_up.json()["rider_id"] == rider_id