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


@pytest.mark.asyncio
async def test_vendor_only_sees_orders_with_own_products(client):
    vendor_a_token, vendor_a_id = await _register(client, "vendora@example.com", "vendor")
    vendor_b_token, _ = await _register(client, "vendorb@example.com", "vendor")
    product_a = await _make_product(client, vendor_a_token)
    product_b = await _make_product(client, vendor_b_token)
    customer_token, _ = await _register(client, "custvendor@example.com", "customer")

    order_a = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "A St", "items": [{"product_id": product_a, "quantity": 1}]},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    order_b = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "B St", "items": [{"product_id": product_b, "quantity": 1}]},
        headers={"Authorization": f"Bearer {customer_token}"},
    )

    listing = await client.get("/api/v1/orders", headers={"Authorization": f"Bearer {vendor_a_token}"})
    order_ids = [o["id"] for o in listing.json()]
    assert order_a.json()["id"] in order_ids
    assert order_b.json()["id"] not in order_ids


@pytest.mark.asyncio
async def test_vendor_cannot_view_or_update_others_order(client):
    vendor_a_token, _ = await _register(client, "vendorc@example.com", "vendor")
    vendor_b_token, _ = await _register(client, "vendord@example.com", "vendor")
    product_b = await _make_product(client, vendor_b_token)
    customer_token, _ = await _register(client, "custvendor2@example.com", "customer")

    order = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "C St", "items": [{"product_id": product_b, "quantity": 1}]},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    order_id = order.json()["id"]

    view = await client.get(f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {vendor_a_token}"})
    assert view.status_code == 403

    update = await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "confirmed"},
        headers={"Authorization": f"Bearer {vendor_a_token}"},
    )
    assert update.status_code == 403


@pytest.mark.asyncio
async def test_rider_sees_only_preparing_unassigned_orders(client):
    vendor_token, _ = await _register(client, "vendore@example.com", "vendor")
    product_id = await _make_product(client, vendor_token)
    customer_token, _ = await _register(client, "custe@example.com", "customer")
    rider_token, _ = await _register(client, "ridere@example.com", "rider")

    order = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "E St", "items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    order_id = order.json()["id"]

    # Still pending — shouldn't show up as available yet.
    available_before = await client.get("/api/v1/orders/available", headers={"Authorization": f"Bearer {rider_token}"})
    assert order_id not in [o["id"] for o in available_before.json()]

    await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "confirmed"},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "preparing"},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )

    available_after = await client.get("/api/v1/orders/available", headers={"Authorization": f"Bearer {rider_token}"})
    assert order_id in [o["id"] for o in available_after.json()]


@pytest.mark.asyncio
async def test_rider_can_accept_available_order(client):
    vendor_token, _ = await _register(client, "vendorf@example.com", "vendor")
    product_id = await _make_product(client, vendor_token)
    customer_token, _ = await _register(client, "custf@example.com", "customer")
    rider_token, rider_id = await _register(client, "riderf@example.com", "rider")

    order = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "F St", "items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    order_id = order.json()["id"]
    await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "confirmed"},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "preparing"},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )

    accept = await client.post(
        f"/api/v1/orders/{order_id}/accept", headers={"Authorization": f"Bearer {rider_token}"}
    )
    assert accept.status_code == 200
    assert accept.json()["rider_id"] == rider_id
    assert accept.json()["status"] == "out_for_delivery"


@pytest.mark.asyncio
async def test_second_rider_cannot_accept_claimed_order(client):
    vendor_token, _ = await _register(client, "vendorg@example.com", "vendor")
    product_id = await _make_product(client, vendor_token)
    customer_token, _ = await _register(client, "custg@example.com", "customer")
    rider_a_token, _ = await _register(client, "ridera2@example.com", "rider")
    rider_b_token, _ = await _register(client, "riderb2@example.com", "rider")

    order = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "G St", "items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    order_id = order.json()["id"]
    await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "confirmed"},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )
    await client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "preparing"},
        headers={"Authorization": f"Bearer {vendor_token}"},
    )

    first = await client.post(
        f"/api/v1/orders/{order_id}/accept", headers={"Authorization": f"Bearer {rider_a_token}"}
    )
    assert first.status_code == 200

    second = await client.post(
        f"/api/v1/orders/{order_id}/accept", headers={"Authorization": f"Bearer {rider_b_token}"}
    )
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_cannot_accept_order_not_ready_for_pickup(client):
    vendor_token, _ = await _register(client, "vendorh@example.com", "vendor")
    product_id = await _make_product(client, vendor_token)
    customer_token, _ = await _register(client, "custh@example.com", "customer")
    rider_token, _ = await _register(client, "riderh@example.com", "rider")

    order = await client.post(
        "/api/v1/orders",
        json={"delivery_address": "H St", "items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    order_id = order.json()["id"]  # still "pending" — not ready for pickup

    res = await client.post(
        f"/api/v1/orders/{order_id}/accept", headers={"Authorization": f"Bearer {rider_token}"}
    )
    assert res.status_code == 400