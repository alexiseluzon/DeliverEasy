import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import Order, OrderItem, OrderStatus, Product, User, UserRole
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from app.services.push import send_push_notification

router = APIRouter(prefix="/orders", tags=["orders"])

# Valid forward transitions — prevents skipping steps or reviving a cancelled/delivered order.
_ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
    OrderStatus.PREPARING: {OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED},
    OrderStatus.OUT_FOR_DELIVERY: {OrderStatus.DELIVERED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: set(),
}


_STATUS_MESSAGES: dict[OrderStatus, str] = {
    OrderStatus.CONFIRMED: "Your order has been confirmed.",
    OrderStatus.PREPARING: "Your order is being prepared.",
    OrderStatus.OUT_FOR_DELIVERY: "Your order is out for delivery!",
    OrderStatus.DELIVERED: "Your order has been delivered.",
    OrderStatus.CANCELLED: "Your order was cancelled.",
}


async def _get_order_or_404(order_id: uuid.UUID, db: AsyncSession) -> Order:
    stmt = select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    order = await db.scalar(stmt)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


async def _vendor_owns_order(order: Order, vendor_id: uuid.UUID, db: AsyncSession) -> bool:
    product_ids = [item.product_id for item in order.items]
    if not product_ids:
        return False
    stmt = select(Product.id).where(Product.id.in_(product_ids), Product.vendor_id == vendor_id).limit(1)
    return await db.scalar(stmt) is not None


async def _assert_can_view(order: Order, user: User, db: AsyncSession) -> None:
    if user.role == UserRole.ADMIN or user.id in (order.customer_id, order.rider_id):
        return
    if user.role == UserRole.VENDOR and await _vendor_owns_order(order, user.id, db):
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")


async def _notify_customer(order: Order, db: AsyncSession) -> None:
    message = _STATUS_MESSAGES.get(order.status)
    if not message:
        return
    customer = await db.get(User, order.customer_id)
    if customer:
        await send_push_notification(
            customer.push_token, "Order update", message, data={"order_id": str(order.id)}
        )


async def _notify_available_riders(db: AsyncSession) -> None:
    """Best-effort fan-out to every rider with a registered push token,
    letting them know a new delivery is ready for pickup."""
    stmt = select(User.push_token).where(User.role == UserRole.RIDER, User.push_token.is_not(None))
    result = await db.execute(stmt)
    for (token,) in result.all():
        await send_push_notification(
            token, "New delivery available", "A new order is ready for pickup.", data={"screen": "deliveries"}
        )


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CUSTOMER, UserRole.ADMIN)),
):
    product_ids = [item.product_id for item in payload.items]
    result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in result.scalars().all()}

    missing = [str(pid) for pid in product_ids if pid not in products]
    if missing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Products not found: {missing}")

    order_items: list[OrderItem] = []
    total = 0
    for item in payload.items:
        product = products[item.product_id]
        if not product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{product.name} is unavailable")
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}",
            )
        product.stock_quantity -= item.quantity
        total += float(product.price) * item.quantity
        order_items.append(OrderItem(product_id=product.id, quantity=item.quantity, unit_price=product.price))

    order = Order(
        customer_id=current_user.id,
        delivery_address=payload.delivery_address,
        total_amount=total,
        items=order_items,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    return order


@router.get("", response_model=list[OrderOut])
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
):
    stmt = select(Order).options(selectinload(Order.items)).offset(offset).limit(limit)
    if current_user.role == UserRole.CUSTOMER:
        stmt = stmt.where(Order.customer_id == current_user.id)
    elif current_user.role == UserRole.RIDER:
        stmt = stmt.where(Order.rider_id == current_user.id)
    elif current_user.role == UserRole.VENDOR:
        stmt = (
            stmt.join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, Product.id == OrderItem.product_id)
            .where(Product.vendor_id == current_user.id)
            .distinct()
        )
    # Admins see all orders — no filter applied.

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/available", response_model=list[OrderOut])
async def list_available_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.RIDER, UserRole.ADMIN)),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Orders ready for pickup with no rider assigned yet."""
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.status == OrderStatus.PREPARING, Order.rider_id.is_(None))
        .order_by(Order.created_at)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/{order_id}/accept", response_model=OrderOut)
async def accept_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.RIDER)),
):
    order = await _get_order_or_404(order_id, db)

    if order.status != OrderStatus.PREPARING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not ready for pickup",
        )

    # Conditional UPDATE closes the race window between two riders accepting
    # the same order at once — only the first to land this write wins;
    # the loser's WHERE clause matches zero rows and rowcount reflects that.
    result = await db.execute(
        update(Order)
        .where(Order.id == order_id, Order.rider_id.is_(None))
        .values(rider_id=current_user.id, status=OrderStatus.OUT_FOR_DELIVERY)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Order already claimed by another rider")

    await db.commit()
    await db.refresh(order, attribute_names=["items", "rider_id", "status"])
    await _notify_customer(order, db)
    return order


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = await _get_order_or_404(order_id, db)
    await _assert_can_view(order, current_user, db)
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: uuid.UUID,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.VENDOR, UserRole.RIDER, UserRole.ADMIN)),
):
    order = await _get_order_or_404(order_id, db)

    if current_user.role == UserRole.RIDER and order.rider_id not in (None, current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Order assigned to another rider")

    if current_user.role == UserRole.VENDOR and not await _vendor_owns_order(order, current_user.id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")

    if payload.status not in _ALLOWED_TRANSITIONS.get(order.status, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot move order from {order.status.value} to {payload.status.value}",
        )

    if current_user.role == UserRole.RIDER and order.rider_id is None:
        order.rider_id = current_user.id

    order.status = payload.status
    await db.commit()
    await db.refresh(order, attribute_names=["items"])
    await _notify_customer(order, db)
    if order.status == OrderStatus.PREPARING:
        await _notify_available_riders(db)
    return order